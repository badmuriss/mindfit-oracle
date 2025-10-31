-- Add updated_at columns to track record modifications
-- These columns will be automatically updated by triggers

-- Add updated_at to users table
ALTER TABLE users ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at to meal_registers table
ALTER TABLE meal_registers ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at to measurements_registers table
ALTER TABLE measurements_registers ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at to exercise_registers table
ALTER TABLE exercise_registers ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at to sensors table
ALTER TABLE sensors ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to set updated_at = created_at for historical data
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE meal_registers SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE measurements_registers SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE exercise_registers SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE sensors SET updated_at = created_at WHERE updated_at IS NULL;

-- Make updated_at NOT NULL after setting initial values
ALTER TABLE users MODIFY updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE meal_registers MODIFY updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE measurements_registers MODIFY updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE exercise_registers MODIFY updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE sensors MODIFY updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
