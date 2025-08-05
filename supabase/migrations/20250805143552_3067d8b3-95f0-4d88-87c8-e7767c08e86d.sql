-- First, just assign pickup orders to Mikaela Storm  
UPDATE pickup_orders 
SET driver_id = 'de8d5462-582a-4bb7-a202-e45451fbb5e0',
    tenant_id = 1234,
    status = 'assigned'
WHERE driver_id IS NULL 
AND id IN (
    '4e54acdc-7e05-4d43-aaf5-33db9c15ae69',
    '1cc3e5d3-f6cb-4ec6-b541-bbaf8616084d', 
    '72306359-183c-4218-b01e-e671e393beab'
);