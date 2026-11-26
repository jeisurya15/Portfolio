import {chapters as original,stack} from '../workshop-content.js';
export {stack};
const edits=[
 ['intro','A little curiosity.','A world of possibilities.','Java full-stack developer. Curious by nature. Building thoughtful software, one idea at a time.','The beginning'],
 ['stack','Made of many parts.','Built to work together.','From the first React component to the last database query. A look at the tools behind the work.','The toolkit'],
 ['lms','Room to learn.','Space to grow.','Connecting courses, assessments and progress through a complete learning platform.','Learning systems'],
 ['smartqueue','Good things.','Less waiting.','A smarter way to manage appointments, queues and the time in between.','SmartQueue'],
 ['shop','From discovery','to your doorstep.','A complete shopping experience, from finding the right product to managing every order.','Commerce'],
 ['fitness','Small steps.','Visible progress.','Turning everyday activity into a clearer picture of your fitness goals.','Fitness tracker'],
 ['lab','Follow the question.','See where it leads.','Experiments in machine learning, data storytelling and software testing.','The playground'],
 ['experience','Learning by doing.','Growing by building.','An IT degree in progress. Two industry internships. A growing collection of lessons.','The journey'],
 ['contact','Your next idea.','Our next conversation.','Have something in mind? Let’s make something useful together.','Say hello'],
];
export const chapters=original.map((c,i)=>({...c,slug:edits[i][0],headline:edits[i][1],accent:edits[i][2],summary:edits[i][3],name:edits[i][4]}));
export const colors=['#ba6842','#7c8b69','#8d9c78','#6f939b','#bd8d69','#a68793','#8d83a4','#8e987b','#bb805c'];
