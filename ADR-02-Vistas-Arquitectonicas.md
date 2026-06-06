# ADR-02: Definición de Vistas Arquitectónicas (Modelo 4+1 adaptado)

| Campo  | Valor |
|--------|-------|
| Autor  | David Alonso Romero Medina |
| Fecha  | 05/06/2026 |
| Estado | `Propuesto` |

---

## Contexto

Tras definir que PokeOracle utilizará el patrón MVC en ASP.NET Core con un motor Expectiminimax para la lógica de Inteligencia Artificial (ADR-01), es necesario documentar las perspectivas del sistema para los distintos perfiles técnicos (desarrolladores, arquitectos y operaciones). Se requiere establecer cómo se estructura el código, cómo interactúan los componentes en tiempo de ejecución y cómo se distribuirá el software en la infraestructura de hardware, cumpliendo con los estándares de documentación del proyecto.

---

## Decisión

Se ha decidido implementar una adaptación del **Modelo de Vistas Arquitectónicas** para representar el sistema desde 4 perspectivas fundamentales mediante diagramas de Mermaid: Lógica, Procesos, Física y Despliegue.

### ¿Por qué?

Un solo diagrama C4 no es suficiente para explicar la complejidad del motor predictivo. 
* La **Vista Lógica** facilita el desarrollo al mapear las clases orientadas a objetos (Modelos).
* La **Vista de Procesos** es crítica para entender el flujo asíncrono y la evaluación de árboles de decisión turno por turno.
* Las **Vistas Física y de Despliegue** aseguran que los recursos del servidor web estén correctamente dimensionados para soportar los cálculos algorítmicos sin saturar el entorno.

### Alternativas consideradas

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| **Mantener un único diagrama general (C4 Nivel 2)** | No ofrece el nivel de detalle necesario para programar la interacción exacta entre la IA y el Controlador, dejando ambigüedades en la implementación. |
| **UML Completo (Casos de uso, Estados, Actividad)** | Generaría un exceso de documentación (*Over-engineering*) innecesario para el tamaño actual del simulador. |
| **Documentación puramente textual** | Explicar el ciclo de eventos del Minimax sin diagramas de secuencia resulta confuso y propenso a errores de interpretación. |

---

## Diagramas de las 4 Vistas

### 1. Vista Lógica

```mermaid
classDiagram
    class BatallaController {
        +RecibirTurno(accion)
        +ActualizarVista()
    }
    class MotorIAPredictiva {
        -int ProfundidadArbol
        +EvaluarExpectiminimax(estadoActual)
        +GenerarHeuristica()
    }
    class Pokemon {
        +String Nombre
        +int PuntosSalud
        +List~Movimiento~ Ataques
        +RecibirDano()
    }
    class Movimiento {
        +String Tipo
        +int Potencia
        +int Precision
    }
    
    BatallaController --> MotorIAPredictiva : "Solicita análisis"
    MotorIAPredictiva --> Pokemon : "Evalúa estado"
    Pokemon "1" *-- "4" Movimiento : "Posee"