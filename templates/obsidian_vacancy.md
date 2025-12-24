---
type: application

company: "{{company}}"
role: "{{role}}"
role_norm: "{{role_norm}}"
level: "{{level}}"  # intern | junior | junior+ | middle | senior

source: "{{source}}"  # hh.ru | career.habr.com | geekjob | superjob.ru | telegram | other
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
next_action:
next_due:
priority: medium  # low | medium | high

tags: {{tags_yaml}}
---

## Snapshot

- **Company:** {{company}}
- **Role:** {{role}} ({{level}})
- **Location:** {{location_address}}
- **Metro:** {{location_metro}}
- **Work mode:** {{work_mode}}
- **Commute:** {{commute_minutes}} мин
- **Salary (min net):** {{salary_min_net}} {{salary_currency}}
- **Source:** {{source}}
- **Link:** {{job_link}}

## Job description (raw)

```vacancy
{{job_description_raw}}
```
Cover letter (draft)
```
{{cover_letter_draft}}
```
[[Вакансии - dashboard]]