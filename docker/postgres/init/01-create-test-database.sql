-- Auto-run on FIRST initialization of the PostgreSQL primary volume.
-- Keeps the automated test suite isolated from the local dev database.
CREATE DATABASE openerp_test OWNER openerp;
