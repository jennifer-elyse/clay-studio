# ERD

Studio itself stores session metadata and `settings.json` (the projects folder) in the installation profile on disk, not in Postgres. Generated apps own their data.

```mermaid
erDiagram
  StudioSession {
    string agentId
    string seat
    string model
    string appDir
    string previewPort
    string lastRunId
  }

  Settings {
    string projectsRoot
    object seatModels "per seat: optional work and fast model names; blank or default is not stored"
  }

  AppWorkspace {
    string slug
    string path
  }

  Plan {
    string id
    string path
    string status
  }

  StudioSession ||--|| AppWorkspace : uses
  Settings ||--o{ AppWorkspace : "holds new"
  AppWorkspace ||--o{ Plan : contains
```

Generated request-tracker tables are documented in `templates/web-app/docs/erd.md`.
