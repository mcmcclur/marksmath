// Adapted from @mcmcclur/unfolding-polyhedra (first interactive only).
export function* createPolyhedron(create_indexedFaceSet,polyhedron_data,d3,create_indexedLineSet,create_transform,cross,show_x3d,$0,invalidation)
{
  // Set up the first polygonal face.
  let face0 = create_indexedFaceSet(
    [polyhedron_data.faces[0].map((i) => polyhedron_data.vertices[i])],
    {
      color: d3.schemeCategory10[polyhedron_data.faces[0].length - 3]
    }
  );
  let outline0 = create_indexedLineSet([
    polyhedron_data.faces[0]
      .map((i) => polyhedron_data.vertices[i])
      .concat([polyhedron_data.vertices[polyhedron_data.faces[0][0]]])
  ]);

  // Attach the first face to a root transform that's unaffected by the slider
  let root_transform = create_transform({ id: "shift0" });
  d3.select(root_transform).append(() => face0);
  d3.select(root_transform).append(() => outline0);

  // Rotate the root transform so that the first face is (generally)
  // near the bottom. Method is not perfect.
  let rotation0;
  let eps = 10 ** -6;
  let p0 = d3
    .zip(...polyhedron_data.faces[0].map((i) => polyhedron_data.vertices[i]))
    .map((v) => d3.sum(v));

  if (Math.abs(p0[0]) < eps && Math.abs(p0[1]) < eps && p0[2] > 0) {
    rotation0 = `1 0 0 ${Math.PI}`;
  } else if (Math.abs(p0[0]) < eps && Math.abs(p0[1]) < eps && p0[2] < 0) {
    rotation0 = `1 0 0 0`;
  } else {
    let d = cross(p0, [0, 0, -1]);
    let P = Math.sqrt(p0[0] ** 2 + p0[1] ** 2 + p0[2] ** 2);
    let D = Math.sqrt(d[0] ** 2 + d[1] ** 2 + d[2] ** 2);
    let t = Math.asin(D / P);
    if (p0[2] > 0) {
      t = t + Math.PI / 2;
    }
    rotation0 = `${d[0]} ${d[1]} ${d[2]}, ${t}`;
  }
  d3.select(root_transform).attr("rotation", rotation0);

  // Now we're going to use the spanning tree for the polyhedron in
  // the data file to build the polyhedron. The following root object
  // is the root of our tree. The first few edges in our spanning tree
  // tell us which faces to append to our root face. We then proceed
  // recursively outward from there appending faces as we go. Each
  // face is embedded in transforms that make it easy rotate the
  // newly attached face about the edge to which it's attached.
  let root = {
    face_idx: 0,
    label: 0,
    transform: root_transform
  };

  let stack = [root];
  while (stack.length > 0) {
    let node = stack.pop();
    let edges = polyhedron_data.spanningTree.filter(
      (o) => o.source == node.face_idx
    );
    edges.forEach(function (e) {
      let face_idx = e.target;
      let shift_back = create_transform({ id: `shift_back${face_idx}` });
      let rotation = create_transform({ id: `rotation${face_idx}` });
      let shift = create_transform({ id: `shift${face_idx}` });
      let face = create_indexedFaceSet(
        [
          polyhedron_data.faces[face_idx].map(
            (i) => polyhedron_data.vertices[i]
          )
        ],
        {
          color: d3.schemeCategory10[polyhedron_data.faces[face_idx].length - 3]
        }
      );
      let outline = create_indexedLineSet([
        polyhedron_data.faces[face_idx]
          .map((i) => polyhedron_data.vertices[i])
          .concat([
            polyhedron_data.vertices[polyhedron_data.faces[face_idx][0]]
          ])
      ]);
      d3.select(shift_back)
        .append(() => rotation)
        .append(() => shift)
        .append(() => face);
      d3.select(shift).append(() => outline);
      d3.select(node.transform).append(() => shift_back);

      let new_node = {
        face_idx: face_idx,
        transform: shift
      };
      stack.push(new_node);
    });
  }

  let cube_scale = polyhedron_data.name == "cube" ? 1.3 : 0.7;
  let position = [4, 6, 2].map((s) => s * cube_scale * polyhedron_data.size);
  let picGen = show_x3d([root.transform], {
    show_axes: false,
    width: Math.max(300, window.innerWidth - 32),
    height: Math.max(240, window.innerHeight - 155),
    viewpoint: {
      position: position.toString(),
      orientation:
        "0.1802632339758993,0.5953690175543821,0.7829692838246467,2.6760585273011896"
    }
  });

  // This next section is based on some suggestions from Mootari. It seems quite nice
  // since running the animation in this same cell allows us to invalidate.
  let pic = picGen.next().value;
  yield pic;
  Array.from(picGen); // run generator to completion

  let scrubber = d3.select($0);
  let onInput = function () {
    let t = this.value;
    polyhedron_data.spanningTree.forEach(function (e) {
      d3.select(pic)
        .select(`#shift_back${e.target}`)
        .attr("translation", e.point.toString())
        .select(`#rotation${e.target}`)
        .attr(
          "rotation",
          e.direction.concat([-t * (Math.PI - e.dihedralAngle)]).toString()
        )
        .select(`#shift${e.target}`)
        .attr("translation", e.point.map((x) => -x).toString());
    });
  };
  scrubber.on("input.unfolding", onInput);
  onInput.call(scrubber.node());

  invalidation.then(() => {
    if (scrubber.on("input.unfolding") === onInput) scrubber.on("input.unfolding", null);
  });
}

