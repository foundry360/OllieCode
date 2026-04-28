-- Paddle Catch removed from the product: purge hub lesson and all related learner data.

delete from public.user_favorite_lessons
where lesson_id = 'lvl1-paddle-vertical';

delete from public.user_lesson_completions
where lesson_id = 'lvl1-paddle-vertical';

delete from public.saved_mission_progress
where mission_id = 'paddle-bounce';

delete from public.lms_lessons
where id = 'lvl1-paddle-vertical';
