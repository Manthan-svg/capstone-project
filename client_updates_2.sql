-- Insert 6 new lessons to bring the total topics to 11 across the 3 courses
INSERT INTO public.lessons (course_id, title, content_text, video_url, order_index) VALUES
('11111111-1111-1111-1111-111111111111', 'Lesson 3: Yes & No', 'To sign "Yes", make a fist and bob it up and down at the wrist, like a head nodding. To sign "No", extend your index and middle fingers and tap them against your thumb.', null, 3),
('11111111-1111-1111-1111-111111111111', 'Lesson 4: How are you?', 'To sign "How are you?", point to the person, then place both hands on your chest and move them outward, finishing with a thumbs-up gesture.', null, 4),
('22222222-2222-2222-2222-222222222222', 'Lesson 3: Where does it hurt?', 'To ask "Where does it hurt?", point your index finger and move it in a small circle, then raise your eyebrows to indicate a question.', null, 3),
('22222222-2222-2222-2222-222222222222', 'Lesson 4: I need a doctor', 'To sign "Doctor", tap the fingertips of your right hand against the inside of your left wrist. Combine this with the sign for "Need" by hooking your index finger and pulling it downward.', null, 4),
('33333333-3333-3333-3333-333333333333', 'Lesson 2: Days of the Week', 'In ISL, days of the week are often signed by spelling the first letter. For example, "Monday" is signed by forming the letter M and moving it in a small circle.', null, 2),
('33333333-3333-3333-3333-333333333333', 'Lesson 3: Time of Day', 'To sign "Morning", place your left hand on your right bicep and raise your right arm up like the sun rising. To sign "Night", tap your right wrist over your left wrist with hands facing down.', null, 3)
ON CONFLICT DO NOTHING;
