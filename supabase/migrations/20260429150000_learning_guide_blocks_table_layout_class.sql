/*
  Workspace blocks guide: add table class for column width CSS (no-op if already present).
*/

update public.lms_learning_guides
set body_html = replace(body_html, '<table>', '<table class="ollie-toolbox-guide-table">')
where id = 'workspace-blocks-reference'
  and position('ollie-toolbox-guide-table' in body_html) = 0;
