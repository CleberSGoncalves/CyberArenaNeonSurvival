extends Node

## Gerenciador Central de Partida e Estado Global (Godot 4.7.2)
## Conectado como Autoload GameManager

signal score_changed(new_score: int)
signal health_changed(new_health: int)
signal game_over
signal game_started

var score: int = 0
var health: int = 100
var max_health: int = 100
var is_game_active: bool = false
var high_score: int = 0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func start_new_game() -> void:
	score = 0
	health = max_health
	is_game_active = true
	score_changed.emit(score)
	health_changed.emit(health)
	game_started.emit()

func add_score(points: int) -> void:
	if not is_game_active:
		return
	score += points
	if score > high_score:
		high_score = score
	score_changed.emit(score)

func take_damage(amount: int) -> void:
	if not is_game_active:
		return
	health = max(0, health - amount)
	health_changed.emit(health)
	if health <= 0:
		trigger_game_over()

func heal(amount: int) -> void:
	if not is_game_active:
		return
	health = min(max_health, health + amount)
	health_changed.emit(health)

func trigger_game_over() -> void:
	is_game_active = false
	game_over.emit()
