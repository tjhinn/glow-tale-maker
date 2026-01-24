-- Add title_color column to stories table for customizable cover title colors
ALTER TABLE stories 
ADD COLUMN title_color text NOT NULL DEFAULT '#FFFFFF';