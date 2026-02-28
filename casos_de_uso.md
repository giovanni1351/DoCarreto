```plantUML
@startuml
left to right direction

' Estilos básicos para aproximar das cores usadas no Mermaid
skinparam usecase {
    BackgroundColor #fff2cc
    BorderColor #d6b656
}

' Atores
actor "Criador de demandas" as E
actor "Caminhoneiro" as A

' Casos de Uso
usecase "**UC-01** Encontrar demandas" as UC1
usecase "**UC-02** Conversar com o outro usuário" as UC2
usecase "**UC-03** Cadastrar demandas" as UC3
usecase "**UC-04** Atualizar demandas" as UC4
usecase "**UC-05** Cancelar demandas" as UC5
usecase "**UC-06** Cadastrar na plataforma" as UC6
usecase "**UC-07** Logar na plataforma" as UC7
usecase "**UC-08** Candidatar-se em uma demanda" as UC8
usecase "**UC-09** Aceitar um candidato à demanda" as UC9

' Relacionamentos - Criador de demandas
E --> UC2
E --> UC3
E --> UC4
E --> UC5
E --> UC6
E --> UC7
E --> UC9

' Relacionamentos - Caminhoneiro
A --> UC1
A --> UC2
A --> UC6
A --> UC7
A --> UC8

@enduml
```
