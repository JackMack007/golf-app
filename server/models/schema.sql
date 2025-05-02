-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (linked to Supabase auth)
CREATE TABLE users (
  user_id UUID PRIMARY KEY, -- Supabase auth.users.id
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  handicap FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Courses table (with slope_value and course_value)
CREATE TABLE courses (
  course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slope_value FLOAT NOT NULL,
  course_value FLOAT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Holes table
CREATE TABLE holes (
  hole_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 5),
  index INTEGER NOT NULL CHECK (index BETWEEN 1 AND 18)
);

-- Tournaments table
CREATE TABLE tournaments (
  tournament_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  date TIMESTAMP NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(course_id),
  status VARCHAR(50) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tournament Participants junction table
CREATE TABLE tournament_participants (
  tournament_id UUID REFERENCES tournaments(tournament_id),
  user_id UUID REFERENCES users(user_id),
  PRIMARY KEY (tournament_id, user_id)
);

-- Teams table
CREATE TABLE teams (
  team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(tournament_id),
  name VARCHAR(255) NOT NULL
);

-- Team Members junction table
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(team_id),
  user_id UUID REFERENCES users(user_id),
  PRIMARY KEY (team_id, user_id)
);

-- Leaderboards table
CREATE TABLE leaderboards (
  leaderboard_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(tournament_id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual Scores table
CREATE TABLE individual_scores (
  score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(leaderboard_id),
  user_id UUID NOT NULL REFERENCES users(user_id),
  hole_scores JSONB NOT NULL,
  total_score INTEGER NOT NULL,
  handicap_adjusted_score FLOAT NOT NULL
);

-- Team Scores table
CREATE TABLE team_scores (
  team_score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(leaderboard_id),
  team_id UUID NOT NULL REFERENCES teams(team_id),
  total_score INTEGER NOT NULL
);