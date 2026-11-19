create schema certificates;
revoke all on schema certificates from public;
create function certificates.touch() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function certificates.immutable() returns trigger language plpgsql as $$ begin raise exception 'History is append-only'; end $$;
create table certificates.profiles (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Z0-9_-]+$'), name text not null,
 contract_ref text not null check(length(trim(contract_ref))>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table certificates.rules (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references certificates.profiles(id), coverage text not null,
 currency text not null check(currency ~ '^[A-Z]{3}$'), minimum_amount numeric(16,2) not null check(minimum_amount>=0),
 additional_insured boolean not null default false, waiver boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(profile_id,coverage)
);
create table certificates.vendors (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Z0-9_-]+$'), name text not null check(length(trim(name))>0),
 profile_id uuid references certificates.profiles(id), owner text not null default '', region text not null default '',
 retention_review date, active boolean not null default true, source_payload jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table certificates.policies (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Z0-9_-]+$'), vendor_id uuid not null references certificates.vendors(id),
 coverage text not null, policy_number text not null, insurer text not null, currency text not null check(currency ~ '^[A-Z]{3}$'),
 limit_amount numeric(16,2) not null check(limit_amount>=0), effective_on date not null, expires_on date not null,
 additional_insured boolean, waiver boolean, evidence_ref text not null default '', source_payload jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(expires_on>effective_on)
);
create table certificates.reviews (
 id uuid primary key default gen_random_uuid(), policy_id uuid not null references certificates.policies(id), verdict text not null check(verdict in ('verified','rejected')),
 actor text not null check(length(trim(actor))>0), evidence text not null check(length(trim(evidence))>0), note text not null check(length(trim(note))>0),
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default now()
);
create table certificates.activity (
 id uuid primary key default gen_random_uuid(), vendor_id uuid references certificates.vendors(id), action text not null,
 actor text not null check(length(trim(actor))>0), note text not null, payload jsonb not null default '{}',
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default now()
);
create index policies_vendor on certificates.policies(vendor_id);
create index reviews_policy on certificates.reviews(policy_id,created_at desc);
create index activity_vendor on certificates.activity(vendor_id,created_at desc);
do $$ declare t text; begin
 foreach t in array array['profiles','rules','vendors','policies'] loop
 execute format('create trigger touch before update on certificates.%I for each row execute function certificates.touch()', t);
 end loop;
 foreach t in array array['reviews','activity'] loop
 execute format('create trigger immutable before update or delete on certificates.%I for each row execute function certificates.immutable()',t);
 end loop;
 foreach t in array array['profiles','rules','vendors','policies','reviews','activity'] loop
 execute format('alter table certificates.%I enable row level security',t);
 execute format('revoke all on certificates.%I from public',t);
 end loop;
end $$;
create view certificates.policy_evidence as
 select p.*, r.verdict, r.actor as reviewer,r.evidence as review_evidence,r.created_at as reviewed_at
 from certificates.policies p left join lateral
 (select * from certificates.reviews r where r.policy_id=p.id order by r.created_at desc,r.id limit 1) r on true;
create view certificates.renewals as
 select v.code as vendor,v.name,p.code as policy,p.coverage,p.expires_on,p.expires_on-current_date as days_left,
 p.verdict, v.owner from certificates.policy_evidence p join certificates.vendors v on v.id=p.vendor_id
 where v.active and p.expires_on<=current_date+60
 order by p.expires_on,v.code,p.code;
create view certificates.review_queue as
 select v.code as vendor,v.name,p.code as policy,p.coverage,p.insurer,p.evidence_ref,
 coalesce(p.verdict,'unreviewed') as review_state from certificates.policy_evidence p join certificates.vendors v on v.id=p.vendor_id
 where v.active and (p.verdict is distinct from 'verified' or p.reviewed_at<p.updated_at)
 order by v.code,p.code;
create view certificates.vendor_workload as
 select v.code as vendor,v.name,v.owner,v.region,pr.code as profile,
 count(p.id)::int as policies,count(p.id) filter(where p.verdict='verified' and p.reviewed_at>=p.updated_at)::int as verified,
 max(a.created_at) filter(where a.action='log') as last_follow_up
 from certificates.vendors v left join certificates.profiles pr on pr.id=v.profile_id
 left join certificates.policy_evidence p on p.vendor_id=v.id
 left join lateral(select created_at,action from certificates.activity where vendor_id=v.id and action='log' order by created_at desc limit 1) a on true
 where v.active group by v.id,pr.code order by v.code;
