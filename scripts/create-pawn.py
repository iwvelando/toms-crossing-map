"""Run in Blender's Python console or MCP; preserves existing scene objects."""
import bpy
from pathlib import Path

output = Path(bpy.app.tempdir) / 'kalin-pawn.glb'  # caller can override EXPORT_PATH
output = Path(globals().get('EXPORT_PATH', output))
prior_selection = list(bpy.context.selected_objects)
prior_active = bpy.context.view_layer.objects.active
collection = bpy.data.collections.new('Crossing — brass pawn')
bpy.context.scene.collection.children.link(collection)
created = []
material = bpy.data.materials.new('Crossing | aged brass')
material.diffuse_color = (0.66, 0.39, 0.12, 1)
material.use_nodes = True
shader = material.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value = (0.66, 0.39, 0.12, 1)
shader.inputs['Metallic'].default_value = 0.7
shader.inputs['Roughness'].default_value = 0.29

def retain(name):
    obj = bpy.context.object
    obj.name = name
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(material)
    for face in obj.data.polygons:
        face.use_smooth = True
    created.append(obj)
    return obj

bpy.ops.object.select_all(action='DESELECT')
for radius, depth, z in [(0.44, 0.13, 0.065), (0.36, 0.08, 0.17), (0.28, 0.06, 0.24)]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius, depth=depth, location=(0, 0, z))
    obj = retain('Pawn | turned base')
    bevel = obj.modifiers.new('Soft machined rim', 'BEVEL')
    bevel.width = 0.025
    bevel.segments = 3
bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=0.27, radius2=0.13, depth=0.61, location=(0, 0, 0.55))
retain('Pawn | taper')
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.24, location=(0, 0, 1.04))
retain('Pawn | crown')
bpy.ops.mesh.primitive_torus_add(major_radius=0.18, minor_radius=0.04, major_segments=40, minor_segments=12, location=(0, 0, 0.86))
retain('Pawn | collar')
bpy.ops.object.select_all(action='DESELECT')
for obj in created:
    obj.select_set(True)
bpy.context.view_layer.objects.active = created[0]
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB', use_selection=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in prior_selection:
    obj.select_set(True)
bpy.context.view_layer.objects.active = prior_active
result = {'path': str(output), 'objects': len(created), 'bytes': output.stat().st_size}
