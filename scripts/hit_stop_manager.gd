extends Node
class_name HitStopManager

## HitStopManager — Micro-congelamento tátil de impacto (Godot 4.7.2)
## Pausa sutilmente a árvore do jogo por 40ms a 70ms em impactos críticos

signal hit_stop_finished

var _timer: SceneTreeTimer = null

func trigger_hit_stop(duration_sec: float = 0.05) -> void:
	if not is_inside_tree():
		return
	get_tree().paused = true
	_timer = get_tree().create_timer(duration_sec, true, false, true)
	_timer.timeout.connect(_on_timeout)

func _on_timeout() -> void:
	if is_inside_tree():
		get_tree().paused = false
		hit_stop_finished.emit()
