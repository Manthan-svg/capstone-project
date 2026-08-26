-- Insert 7 new courses to bring the total to 10 courses
INSERT INTO public.courses (id, title, description, level) VALUES
('44444444-4444-4444-4444-444444444444', 'ISL for the Workplace', 'Essential vocabulary for office environments, meetings, and professional communication.', 'Intermediate'),
('55555555-5555-5555-5555-555555555555', 'Travel & Directions', 'Learn how to ask for directions, sign locations, and use transportation signs.', 'Beginner'),
('66666666-6666-6666-6666-666666666666', 'Expressing Emotions', 'How to correctly sign and express feelings, moods, and mental states.', 'Beginner'),
('77777777-7777-7777-7777-777777777777', 'Emergency & Safety', 'Advanced signs for emergency responders, reporting accidents, and critical care.', 'Advanced'),
('88888888-8888-8888-8888-888888888888', 'Food & Dining', 'Learn signs for everyday foods, ordering at restaurants, and cooking.', 'Beginner'),
('99999999-9999-9999-9999-999999999999', 'Family & Relationships', 'Vocabulary to describe family members, friends, and complex relationships.', 'Intermediate'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tech & Digital World', 'Modern ISL signs for computers, the internet, smartphones, and software.', 'Advanced')
ON CONFLICT DO NOTHING;

-- Insert at least 1 lesson for each of the new courses
INSERT INTO public.lessons (course_id, title, content_text, video_url, order_index) VALUES
('44444444-4444-4444-4444-444444444444', 'Lesson 1: Meeting & Interview', 'Learn how to introduce your role and welcome colleagues to a meeting.', null, 1),
('55555555-5555-5555-5555-555555555555', 'Lesson 1: Left, Right & Straight', 'Directional signs are often relative to the signer. Use your dominant hand to indicate turns.', null, 1),
('66666666-6666-6666-6666-666666666666', 'Lesson 1: Happy & Sad', 'Facial expressions are a mandatory grammatical part of ISL when signing emotions.', null, 1),
('77777777-7777-7777-7777-777777777777', 'Lesson 1: Calling the Police', 'Signs for immediate danger and communicating critical details to 911 dispatch equivalents.', null, 1),
('88888888-8888-8888-8888-888888888888', 'Lesson 1: Water & Bread', 'The basic staples of dining out. Sign "Water" by forming a W and tapping it to your chin.', null, 1),
('99999999-9999-9999-9999-999999999999', 'Lesson 1: Mother & Father', 'Learn the gender locations in sign language (typically forehead for male, chin for female).', null, 1),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lesson 1: Internet & Email', 'Sign "Internet" by connecting the middle fingers of both hands and wiggling them back and forth.', null, 1)
ON CONFLICT DO NOTHING;
