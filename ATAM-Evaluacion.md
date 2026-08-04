# Evaluación ATAM - PokeOracle

## Escenarios de Calidad

- **Rendimiento:** La API debe retornar la predicción óptima en menos de 500 milisegundos, garantizando una experiencia fluida para el jugador durante la consulta en tiempo real de la batalla simulada.
- **Modificabilidad:** El sistema debe permitir incorporar nuevas mecánicas de juego (tipos, habilidades, objetos, efectos de campo) sin alterar el algoritmo base de IA, facilitando la evolución del simulador sin reescrituras costosas.

## Decisiones Arquitectónicas

- Uso de **EF Core In-Memory** para maximizar la velocidad de lectura y escritura del estado de batalla durante la simulación predictiva.
- Límite de profundidad del algoritmo **Expectiminimax** fijado en **Nivel 3**, equilibrando tiempo de respuesta y calidad de la predicción.
- Adopción de **Clean Architecture** junto con el **Patrón Strategy** para aislar las fórmulas de daño y desacoplar la lógica de dominio de la infraestructura.

## Trade-offs

- **Velocidad vs. Persistencia:** EF Core In-Memory ofrece latencia mínima al mantener el estado en RAM, pero pierde toda la información si el servidor se detiene o reinicia, sin recuperación automática del historial de batallas.
- **Tiempo de Respuesta vs. Visión a largo plazo:** El Nivel 3 de profundidad en Expectiminimax permite cumplir el objetivo de respuesta sub-500 ms, pero limita la capacidad de detectar estrategias de sacrificio o setups que requieran 5 o más turnos para materializarse.

## Puntos de Sensibilidad y Riesgos

- **Punto de Sensibilidad:** La CPU es sensible al factor de ramificación generado por ataques de múltiples golpes, efectos secundarios encadenados y ramas probabilísticas del árbol de juego, lo que incrementa exponencialmente el número de nodos evaluados por turno.
- **Riesgo:** Peticiones simultáneas complejas (varias simulaciones profundas en paralelo) podrían provocar un **Timeout** en la API o consumir toda la RAM disponible del servidor, desencadenando una **OutOfMemoryException** y afectando la disponibilidad del servicio.
