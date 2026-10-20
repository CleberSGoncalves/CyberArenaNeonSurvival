extends Camera2D
class_name JuiceCamera2D

## JuiceCamera2D — Câmera cinemática com Trauma² Screen Shake, Deadzone e Look-Ahead (Godot 4.7.2)

@export var target_node: Node2D = null
@export var smoothing_speed: float = 10.0
@export var look_ahead_distance: float = 80.0
@export var look_ahead_speed: float = 5.0

# Trauma² Screen Shake
@export var max_offset: float = 24.0
@export var max_angle: float = 0.08
@export var trauma_decay: float = 1.4

var _trauma: float = 0.0
var _look_ahead_offset: Vector2 = Vector2.ZERO

func _ready() -> void:
	drag_horizontal_enabled = true
	drag_vertical_enabled = true
	drag_left_margin = 0.2
	drag_right_margin = 0.2
	drag_top_margin = 0.15
	drag_bottom_margin = 0.15

func add_trauma(amount: float) -> void:
	_trauma = clampf(_trauma + amount, 0.0, 1.0)

func _physics_process(delta: float) -> void:
	# Camera follow
	if is_instance_valid(target_node):
		var vel: Vector2 = target_node.velocity if "velocity" in target_node else Vector2.ZERO
		var desired_offset: Vector2 = vel.normalized() * look_ahead_distance if vel.length() > 10.0 else Vector2.ZERO
		_look_ahead_offset = _look_ahead_offset.lerp(desired_offset, look_ahead_speed * delta)
		global_position = global_position.lerp(
			target_node.global_position + _look_ahead_offset,
			smoothing_speed * delta
		)

	# Screen Shake Trauma²
	if _trauma > 0.0:
		_trauma = maxf(0.0, _trauma - trauma_decay * delta)
		var shake: float = _trauma * _trauma
		offset.x = (randf() * 2.0 - 1.0) * max_offset * shake
		offset.y = (randf() * 2.0 - 1.0) * max_offset * shake
		rotation = (randf() * 2.0 - 1.0) * max_angle * shake
	else:
		offset = Vector2.ZERO
		rotation = 0.0
