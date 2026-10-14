USE tutorialhub_db;

INSERT INTO courses
(title, category, description, instructor, difficulty, duration_hours)
VALUES
('HTML and CSS Fundamentals', 'Web Development',
 'Learn to build responsive websites from scratch.',
 'Rahul Sharma', 'Beginner', 8),

('JavaScript Masterclass', 'Programming',
 'Learn JavaScript fundamentals, DOM manipulation and APIs.',
 'Priya Patel', 'Intermediate', 15),

('MySQL for Developers', 'Database',
 'Learn SQL queries, joins, relationships and database design.',
 'Amit Verma', 'Beginner', 10),

('Advanced Git and GitHub', 'Developer Tools',
 'Learn branching, rebasing, merging and collaboration workflows.',
 'Neha Singh', 'Advanced', 6);

INSERT INTO tutorials
(title, description, category, content, course_id)
VALUES
('Your First HTML Page',
 'Build your first webpage using HTML.',
 'HTML',
 'Create an HTML document, add headings and paragraphs, and open it in a browser.',
 1),

('Understanding CSS Flexbox',
 'Learn to arrange elements with Flexbox.',
 'CSS',
 'Explore display flex, justify-content, align-items and gap.',
 1),

('JavaScript Variables',
 'Understand let, const and variables.',
 'JavaScript',
 'Declare variables and practice working with strings and numbers.',
 2),

('Essential Git Commands',
 'Learn the most useful commands for everyday development.',
 'Git',
 'Practice git status, git add, git commit, git log and git diff.',
 4);

INSERT INTO community_stats
(members_count, tutorials_count, courses_count)
VALUES
(1250, 4, 4);