-- File: backend/migrations/003_add_constraints.sql
-- Adds foreign key constraints and indexes for data integrity

-- Add foreign key constraints
ALTER TABLE interview_rooms 
ADD CONSTRAINT fk_interview_rooms_interview_id 
FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE;

ALTER TABLE interviews 
ADD CONSTRAINT fk_interviews_host_id 
FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE interviews 
ADD CONSTRAINT fk_interviews_candidate_id 
FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE feedbacks 
ADD CONSTRAINT fk_feedbacks_interview_id 
FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE;

ALTER TABLE code_sessions 
ADD CONSTRAINT fk_code_sessions_interview_id 
FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_interviews_host_id ON interviews(host_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at);
CREATE INDEX IF NOT EXISTS idx_feedbacks_interview_id ON feedbacks(interview_id);
CREATE INDEX IF NOT EXISTS idx_code_sessions_interview_id ON code_sessions(interview_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add NOT NULL constraints where appropriate
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ALTER COLUMN password SET NOT NULL;
ALTER TABLE interviews ALTER COLUMN title SET NOT NULL;
ALTER TABLE interviews ALTER COLUMN host_id SET NOT NULL;
ALTER TABLE feedbacks ALTER COLUMN interview_id SET NOT NULL;
