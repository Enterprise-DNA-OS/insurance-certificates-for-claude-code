do $$ declare p uuid; v uuid; pol uuid; begin
 if exists(select 1 from certificates.profiles where code='DEMO') then return; end if;
 insert into certificates.profiles(code,name,contract_ref) values('DEMO','Demonstration supplier terms','Fictional procurement agreement 2026 section 8') returning id into p;
 insert into certificates.rules(profile_id,coverage,currency,minimum_amount,additional_insured,waiver) values
 (p,'public_liability','NZD',2000000,true,false),(p,'professional_indemnity','NZD',1000000,false,false);
 insert into certificates.vendors(code,name,profile_id,owner,region,retention_review) values
 ('HARBOR','Harbor Survey Services',p,'Alex','Auckland',current_date+180),
 ('FERN','Fern Equipment Testing',p,'Moana','Wellington',current_date-7),
 ('RIDGE','Ridge Consulting',p,'Alex','Christchurch',current_date+180),
 ('NORTH','North Materials Supply',null,'Moana','Hamilton',current_date+180);
 select id into v from certificates.vendors where code='HARBOR';
 insert into certificates.policies(code,vendor_id,coverage,policy_number,insurer,currency,limit_amount,effective_on,expires_on,additional_insured,waiver,evidence_ref) values
 ('HARBOR-PL',v,'public_liability','DEMO-PL-100','Fictional Mutual','NZD',2000000,current_date-300,current_date+20,true,false,'demo/harbor-pl.pdf'),
 ('HARBOR-PI',v,'professional_indemnity','DEMO-PI-100','Fictional Mutual','NZD',1000000,current_date-300,current_date+65,false,false,'demo/harbor-pi.pdf');
 select id into v from certificates.vendors where code='FERN';
 insert into certificates.policies(code,vendor_id,coverage,policy_number,insurer,currency,limit_amount,effective_on,expires_on,additional_insured,evidence_ref) values
 ('FERN-PL',v,'public_liability','DEMO-PL-200','Fictional Mutual','NZD',1000000,current_date-370,current_date-5,null,'demo/fern-pl.pdf');
 select id into v from certificates.vendors where code='RIDGE';
 insert into certificates.policies(code,vendor_id,coverage,policy_number,insurer,currency,limit_amount,effective_on,expires_on,additional_insured,evidence_ref) values
 ('RIDGE-PL',v,'public_liability','DEMO-PL-300','Example Underwriters','AUD',2000000,current_date-100,current_date+200,true,'demo/ridge-pl.pdf'),
 ('RIDGE-PI',v,'professional_indemnity','DEMO-PI-300','Example Underwriters','NZD',1000000,current_date+5,current_date+365,false,'demo/ridge-pi.pdf');
 for pol in select id from certificates.policies where code in ('HARBOR-PL','HARBOR-PI','RIDGE-PI') loop
 insert into certificates.reviews(policy_id,verdict,actor,evidence,note) values(pol,'verified','Demo reviewer','Fictional policy and endorsement check','Synthetic demonstration evidence only');
 end loop;
 insert into certificates.activity(vendor_id,action,actor,note,created_at)
 select id,'log','Demo reviewer','Renewal evidence requested in fictional demo',now()-interval '20 days' from certificates.vendors where code='FERN';
end $$;
