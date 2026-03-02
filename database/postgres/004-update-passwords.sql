-- Update all user accounts with a valid bcrypt hash for password123
UPDATE user_accounts 
SET password_hash = '$2b$10$HqNm3E99Be2hwc9il0RpjupBNb1.h5XWURcf3U2g8TNGO2oDCrV6i'
WHERE email IN (
    'liam.murphy@email.com',
    'cian.obrien@email.com',
    'sean.kelly@email.com',
    'conor.walsh@email.com',
    'oisin.ryan@email.com',
    'darragh.brennan@email.com',
    'eoin.mccarthy@email.com',
    'sarah.oconnor@physio.ie',
    'michael.fitzgerald@coaching.ie',
    'emma.doyle@strength.ie',
    'james.osullivan@admin.ie'
);

SELECT 
    'Password Update Complete' as status,
    COUNT(*) as accounts_updated
FROM user_accounts
WHERE email IN (
    'liam.murphy@email.com',
    'cian.obrien@email.com',
    'sean.kelly@email.com',
    'conor.walsh@email.com',
    'oisin.ryan@email.com',
    'darragh.brennan@email.com',
    'eoin.mccarthy@email.com',
    'sarah.oconnor@physio.ie',
    'michael.fitzgerald@coaching.ie',
    'emma.doyle@strength.ie',
    'james.osullivan@admin.ie'
);
