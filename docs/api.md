\# Data Format Specification



\## Task Object

```json

{

&nbsp; "id": "uuid-string",

&nbsp; "title": "Task name", 

&nbsp; "notes": "Optional details",

&nbsp; "createdAt": "2026-02-26T12:00:00Z",

&nbsp; "dueDate": "2026-02-28", // YYYY-MM-DD

&nbsp; "status": "pending|done",

&nbsp; "estimatedMinutes": 15,

&nbsp; "actualMinutes": 12,

&nbsp; "tags": \["review", "fitness"],

&nbsp; "isHabit": true,

&nbsp; "streak": 7,

&nbsp; "lastDoneAt": "2026-02-26T10:30:00Z"

}





Export Schema (CSV)

Date,Task,Status,Est,Actual,Tags,Habit,Streak,Notes

2026-02-26,Daily review,done,15,12,"review",YES,3,"Notes here"



Template Object



**{**

  **"id": "daily",**

  **"name": "Daily Review",** 

  **"title": "Daily review \& plan",**

  **"estimatedMinutes": 15,**

  **"tags": \["review"],**

  **"isHabit": true**

**}**







