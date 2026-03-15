/*
  # Fix audits table - make project_id nullable

  ## Changes
  - Make project_id nullable on audits table so users can run one-off audits
    without needing to associate them with a project
  - Update the foreign key constraint to keep CASCADE but allow NULL
*/

ALTER TABLE audits ALTER COLUMN project_id DROP NOT NULL;
