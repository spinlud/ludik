# Deletes selected objects recursively from the object hierarchy

import bpy

obj = bpy.context.object
stack = [obj]

while len(stack) > 0:
	tmp = stack.pop()
	if hasattr(tmp, "children"):
		for child in tmp.children:
			child.select = True
			stack.append(child)

bpy.ops.object.delete()