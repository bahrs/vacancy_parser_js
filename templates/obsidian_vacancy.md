---
type: application

company: "{{company}}"
role: "{{role}}"
role_norm: "{{role_norm}}"
level: "{{level}}"  # intern | junior | junior+ | middle | middle+ | senior | lead

source: "{{source}}"  # hh.ru | career.habr.com | geekjob | superjob.ru | telegram | hunted
job_link: "{{job_link}}"

work_mode: "{{work_mode}}"  # office | hybrid | remote | unspecified

location_address: "{{location_address}}"
location_metro: "{{location_metro}}"
commute_minutes: "{{commute_minutes}}"

salary: "{{salary}}"

stack: {{stack_yaml}}
skills: {{skills_yaml}}

status: want to apply  # want to apply | applied | interview | offer | rejected | vacancy archived
apply_date: "{{apply_date}}"
publish_date: "{{publish_date}}"
next_action:
next_due:
HR_contact: 
priority: medium  # low | medium | high

tags: {{tags_yaml}}
---
## Snapshot
- 🧠 `= "**" + this.next_action + ":**   " + dateformat(this.next_due, "ccc  dd LLL  HH") + "<sup>" + dateformat(this.next_due, "mm") + "</sup>"`
- 🏢 **Company:** `= this.company + " | " + this.work_mode`
- 🧑‍💻 **Role:** `= this.role + " | *" + this.level + "*"`
- 🚇 **Metro:** `= this.location_metro + " *("+ this.location_address +")*"`
- 💰 **Salary:** `= this.salary + " руб."`
- 🤝 **HR Contact:** @`= this.HR_contact`

## Job description (raw)

```vacancy
{{job_description_raw}}
```
Cover letter (draft)
```
{{cover_letter_draft}}
```
[[Вакансии - dashboard]]