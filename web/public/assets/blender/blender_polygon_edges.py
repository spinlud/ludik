import sys
import bpy
import json
import os

clear = lambda: os.system("cls")

obj = bpy.context.object

vertices = [ (v.co.x, v.co.y) for v in obj.data.vertices]
edges = [ (vertices[e.vertices[0]], vertices[e.vertices[1]]) for e in obj.data.edges]

# print(vertices)
print("\n")
for e in edges:
	print(e[0], e[1])

# select first element as starting edge
ordered_edges = [edges.pop(0)]

while len(edges) > 0:

	# select last added edge 
	origin = ordered_edges[len(ordered_edges) - 1]

	# set target as the second vertex of the edge
	target_x = origin[1][0]
	target_y = origin[1][1]

	found = False
	print("Searching for adjacent edge of " + str(origin))

	# search for the adjacent edge
	for i in range(len(edges)):

		e = edges[i]

		# check on first vertex
		if e[0][0] == target_x and e[0][1] == target_y:
			ordered_edges.append(edges.pop(i))
			found = True
			break

		# check on second vertex (need to swap coordinates)	
		if e[1][0] == target_x and e[1][1] == target_y:
			e = edges.pop(i)
			ordered_edges.append((e[1], e[0]))
			found = True
			break

	if not found:
		print("Error in geometry: adjacent not found for " + str(origin))
		sys.exit(1)		
	else:
		print("Found adjacent")

	print(len(edges))


print("\n\n")
for e in ordered_edges:
	print(e[0], e[1])


# print(json.dumps(ordered_edges))

# outFile = "D:/Users/lfabbri/Desktop/level_polygon_edges.json" # windows
outFile = "/Users/ludovicofabbri/Desktop/level_polygon_edges.json" # mac

# with open("/Users/ludovicofabbri/Documents/NodeProjects/blender_test/level_polygon_edges.json", "w") as file:
# 	json.dump(ordered_edges, file, indent=4)	

with open(outFile, "w") as file:
	json.dump(ordered_edges, file, indent=4)


	