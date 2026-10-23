import {theme} from '../theme.js';
// Local rendering helpers copied from @mcmcclur/x3dom-primitives.
import define1 from "./utilities.js";

function _show_x3d(width,d3,create_viewpoint,create_axes,x3dom,pbcopy){return(
function* show_x3d(nodes, opts = {}) {
  let {
    viewpoint = "auto",
    show_axes = true,
    // axes_origin = [0, 0, 0],
    extent = "auto",
    nav_type = "examine",
    class_name = "X3D"
  } = opts;

  // Set the width and height
  let w;
  if (opts.width == "auto" || !opts.width) {
    w = width < 800 ? width : 800;
  } else {
    w = opts.width;
  }
  let h;
  if (opts.height == "auto" || !opts.height) {
    h = 0.6 * w;
  } else {
    h = opts.height;
  }

  // Setup the scene
  let container = d3
    .create("div")
    .style("width", `${w}px`)
    .style("height", `${h}px`)
    .style("overflow", "hidden");

  if (opts.class_name) {
    container.attr("class", opts.class_name);
  }

  let x3d = container
    .append("x3d")
    .attr("width", `${w}px`)
    .attr("height", `${h}px`);
  let scene = x3d.append("scene");
  scene.append("background").attr("skyColor", theme.dark ? "0.067 0.106 0.149" : "0.965 0.980 0.988");
  scene.append("navigationInfo").attr("type", nav_type);
  // .attr("typeParams", "0 0 0 1.57");

  // Set the viewpoint, based on opts or automatically
  let x3d_viewpoint, xmin, xmax, ymin, ymax, zmin, zmax;
  if (
    Array.isArray(extent) &&
    extent.length == 3 &&
    Array.isArray(extent[0]) &&
    extent[0].length == 2 &&
    typeof extent[0][0] == "number" &&
    typeof extent[0][1] == "number" &&
    Array.isArray(extent[1]) &&
    extent[1].length == 2 &&
    typeof extent[1][0] == "number" &&
    typeof extent[1][1] == "number" &&
    Array.isArray(extent[1]) &&
    extent[1].length == 2 &&
    typeof extent[2][0] == "number" &&
    typeof extent[2][1] == "number"
  ) {
    xmin = extent[0][0];
    xmax = extent[0][1];
    ymin = extent[1][0];
    ymax = extent[1][1];
    zmin = extent[2][0];
    zmax = extent[2][1];
    extent = { xmin, xmax, ymin, ymax, zmin, zmax };
  }
  if (extent == "auto") {
    if (nodes.length > 0) {
      xmin = d3.min(nodes.map((node) => (node.extent ? node.extent.xmin : -2)));
      xmax = d3.max(nodes.map((node) => (node.extent ? node.extent.xmax : 2)));
      ymin = d3.min(nodes.map((node) => (node.extent ? node.extent.ymin : -2)));
      ymax = d3.max(nodes.map((node) => (node.extent ? node.extent.ymax : 2)));
      zmin = d3.min(nodes.map((node) => (node.extent ? node.extent.zmin : -2)));
      zmax = d3.max(nodes.map((node) => (node.extent ? node.extent.zmax : 2)));
    } else {
      xmin = -2;
      xmax = 2;
      ymin = -2;
      ymax = 2;
      zmin = -2;
      zmax = 2;
    }
    x3d_viewpoint = create_viewpoint({
      xmin: xmin,
      xmax: xmax,
      ymin: ymin,
      ymax: ymax,
      zmin: zmin,
      zmax: zmax
    });
  } else {
    x3d_viewpoint = create_viewpoint(extent);
  }
  if (typeof viewpoint == "object") {
    if (opts.viewpoint.position) {
      x3d_viewpoint.attr("position", opts.viewpoint.position);
    }
    if (opts.viewpoint.orientation) {
      x3d_viewpoint.attr("orientation", opts.viewpoint.orientation);
    }
    if (opts.viewpoint.centerOfRotation) {
      x3d_viewpoint.attr("centerOfRotation", opts.viewpoint.centerOfRotation);
    }
    x3d_viewpoint = x3d_viewpoint;
  }
  scene.append(() => x3d_viewpoint.node());

  // Add the elements of the scene.
  nodes.forEach((node) => scene.append(() => node));
  if (show_axes) {
    opts.label_rotation = x3d_viewpoint.attr("orientation");
    if (extent == "auto") {
      create_axes(
        {
          xmin: xmin,
          xmax: xmax,
          ymin: ymin,
          ymax: ymax,
          zmin: zmin,
          zmax: zmax
        },
        opts
        // { label_rotation: x3d_viewpoint.attr("orientation") }
      ).forEach((node) => scene.append(() => node));
    } else {
      create_axes(
        extent,
        opts
        //                  {label_rotation: x3d_viewpoint.attr("orientation")}
      ).forEach((node) => scene.append(() => node));
    }
  }

  yield container.node();
  x3dom.reload();

  let info = {};
  container.on("keypress", function (evt) {
    if (evt.key == "v") {
      let viewpoint_string = `viewpoint: {position: '${info.position}', orientation: '${info.orientation}'}`;
      pbcopy(viewpoint_string);
    }
  });

  function vpChanged(e) {
    info.position = e.position;
    info.orientation = e.orientation;
  }

  x3d_viewpoint.node().addEventListener("viewpointChanged", vpChanged, false);
}
)}

function _create_indexedFaceSet(d3,path_list_to_indexString,path_list_to_coordString){return(
function create_indexedFaceSet(facets, opts = {}) {
  let { solid = "false", transparency = 0, creaseAngle = "0" } = opts;

  let container = d3.create("transform");
  if (opts.id) {
    container.attr("id", opts.id);
  }
  if (opts.class) {
    container.attr("class", opts.class);
  }
  if (opts.translation) {
    container.attr("translation", opts.translation);
  }
  if (opts.rotation) {
    container.attr("rotation", opts.rotation);
  }
  if (opts.scale) {
    container.attr("scale", opts.scale);
  }

  let index_string = path_list_to_indexString(facets);
  let coord_string = path_list_to_coordString(facets);

  let shape = container.append("shape");
  let appearance = shape.append("appearance");
  if (opts.sortKey || opts.sortKey === 0) {
    appearance.attr("sortKey", opts.sortKey);
  }
  let material = appearance.append("material");
  if (opts.color) {
    material.attr("diffuseColor", opts.color);
    //.attr('emissiveColor', opts.color);
    // .attr('specularColor', opts.color)
  }
  if (opts.transparency) {
    material.attr("transparency", transparency);
  }
  let indexedFaceSet = shape
    .append("indexedFaceset")
    .attr("solid", solid)
    .attr("coordIndex", index_string)
    .attr("creaseAngle", creaseAngle);
  indexedFaceSet.append("coordinate").attr("point", coord_string);
  // if (opts.color_string) {
  //   indexedFaceSet.append('Color').attr('color', opts.color_string);
  // }

  let flat_facets = facets.flat(1);
  let xs = flat_facets.map((a) => a[0]);
  let xmin = d3.min(xs);
  let xmax = d3.max(xs);
  let ys = flat_facets.map((a) => a[1]);
  let ymin = d3.min(ys);
  let ymax = d3.max(ys);
  let zs = flat_facets.map((a) => a[2]);
  let zmin = d3.min(zs);
  let zmax = d3.max(zs);

  let container_node = container.node();
  container_node.extent = {
    xmin: xmin,
    xmax: xmax,
    ymin: ymin,
    ymax: ymax,
    zmin: zmin,
    zmax: zmax
  };

  return container_node;
}
)}

function _create_indexedLineSet(path_list_to_indexString,path_list_to_coordString,d3){return(
function create_indexedLineSet(paths, opts = {}) {
  let { color = "0 0 0", solid = "false", transparency = 0 } = opts;
  let index_string = path_list_to_indexString(paths);
  let coord_string = path_list_to_coordString(paths);

  let container = d3.create("transform");
  if (opts.id) {
    container.attr("id", opts.id);
  }
  if (opts.class) {
    container.attr("class", opts.class);
  }

  let shape = container.append("shape");
  shape
    .append("appearance")
    .append("material")
    .attr("diffuseColor", "0 0 0")
    .attr("transparency", transparency);
  shape
    .append("IndexedLineSet")
    .attr("coordIndex", index_string)
    .append("Coordinate")
    .attr("point", coord_string);

  let flat_paths = paths.flat(1);
  let xs = flat_paths.map((a) => a[0]);
  let xmin = d3.min(xs);
  let xmax = d3.max(xs);
  let ys = flat_paths.map((a) => a[1]);
  let ymin = d3.min(ys);
  let ymax = d3.max(ys);
  let zs = flat_paths.map((a) => a[2]);
  let zmin = d3.min(zs);
  let zmax = d3.max(zs);

  let container_node = container.node();
  container_node.extent = {
    xmin: xmin,
    xmax: xmax,
    ymin: ymin,
    ymax: ymax,
    zmin: zmin,
    zmax: zmax
  };

  return container_node;
}
)}

function _create_box(default_color,d3){return(
function create_box(size, opts = {}) {
  let { color = default_color, transparency = 0, solid = true } = opts;

  let container = d3.create("transform");
  if (opts.id) {
    container.attr("id", opts.id);
  }
  if (opts.class) {
    container.attr("class", opts.class);
  }
  if (opts.translation) {
    container.attr("translation", opts.translation);
  }
  if (opts.rotation) {
    container.attr("rotation", opts.rotation);
  }
  if (opts.scale) {
    container.attr("scale", opts.scale);
  }

  let box_shape = container.append("shape");
  let appearance = box_shape.append("appearance");
  if (opts.sortKey || opts.sortKey === 0) {
    appearance.attr("sortKey", opts.sortKey);
  }
  let material = appearance
    .append("material")
    .attr("diffuseColor", `${color}`)
    .attr("transparency", transparency);
  box_shape.append("box").attr("solid", solid).attr("size", size);

  let extent = {
    xmin: -size[0] / 2,
    xmax: size[0] / 2,
    ymin: -size[1] / 2,
    ymax: size[1] / 2,
    zmin: -size[2] / 2,
    zmax: size[2] / 2
  };

  let container_node = container.node();
  container_node.extent = extent;

  return container_node;
}
)}

function _create_sphere(default_color,d3){return(
function create_sphere(center, radius, opts = {}) {
  let { color = default_color, transparency = 0, solid = true } = opts;

  let container = d3.create("transform");
  if (opts.id) {
    container.attr("id", opts.id);
  }
  if (opts.class) {
    container.attr("class", opts.class);
  }
  if (opts.translation) {
    container.attr("translation", opts.translation);
  }
  if (opts.rotation) {
    container.attr("rotation", opts.rotation);
  }
  if (opts.scale) {
    container.attr("scale", opts.scale);
  }

  let center_transform = container
    .append("transform")
    .attr("translation", `${center[0]} ${center[1]} ${center[2]}`);
  let sphere_shape = center_transform.append("shape");
  let appearance = sphere_shape.append("appearance");
  if (opts.sortKey || opts.sortKey === 0) {
    appearance.attr("sortKey", opts.sortKey);
  }
  let material = appearance
    .append("material")
    .attr("diffuseColor", `${color}`)
    .attr("transparency", transparency);
  //.attr('emissiveColor', `${color}`);
  sphere_shape
    .append("sphere")
    .attr("solid", solid)
    .attr("subdivision", "256,256")
    .attr("radius", radius);

  let extent = {
    xmin: center[0] - radius,
    xmax: center[0] + radius,
    ymin: center[1] - radius,
    ymax: center[1] + radius,
    zmin: center[2] - radius,
    zmax: center[2] + radius
  };

  let container_node = container.node();
  container_node.extent = extent;

  return container_node;
}
)}

function _create_text(d3){return(
function create_text(text, center, opts = {}) {
  let {
    color = "black",
    size = "0.4",
    style = "italic",
    rotation = "1 0 0 1.57"
  } = opts;
  let container = d3.create("transform");
  if (opts.id) {
    container.attr("id", opts.id);
  }
  if (opts.class) {
    container.attr("class", opts.class);
  }
  if (opts.translation) {
    container.attr("translation", opts.translation);
  }
  // if (opts.rotation) {
  //   container.attr("rotation", opts.rotation);
  // }
  if (opts.scale) {
    container.attr("scale", opts.scale);
  }

  let transform = container
    .append("transform")
    .attr("translation", `${center[0]} ${center[1]} ${center[2]}`)
    .attr("rotation", rotation);
  let text_shape = transform.append("shape");
  text_shape
    .append("appearance")
    .append("material")
    .attr("diffuseColor", `${color}`);
  text_shape
    .append("text")
    .attr("string", text)
    .attr("solid", "false")
    .append("fontstyle")
    .attr("size", size)
    .attr("style", style);

  let container_node = container.node();

  return container_node;
}
)}

function _create_pointSet(d3,pt_list_to_coordString){return(
function create_pointSet(coords, opts = {}) {
  let { color = "black" } = opts;
  let container = d3.create("transform");
  if (opts.id) {
    container.attr("id", opts.id);
  }
  if (opts.class) {
    container.attr("class", opts.class);
  }

  let pointSet_Shape = container.append("shape");
  pointSet_Shape
    .append("Appearance")
    .append("Material")
    .attr("emissiveColor", color);

  pointSet_Shape.append("PointSet").append("Coordinate").attr(
    "point",
    pt_list_to_coordString(coords)
    // coords.map((a) => a.toString().replace(/,/g, " ")).toString()
  );

  let container_node = container.node();

  return container_node;
}
)}

function _create_cylinder(default_color,d3,normalize,rotation_vector){return(
function create_cylinder(o, d, r, l, opts = {}) {
  let {
    color = default_color,
    transparency = 0,
    bottom = true,
    top = true,
    solid = false
  } = opts;
  let container = d3.create("transform");
  if (opts.id) {
    container.attr("id", opts.id);
  }
  if (opts.class) {
    container.attr("class", opts.class);
  }
  if (opts.translation) {
    container.attr("translation", opts.translation);
  }
  if (opts.rotation) {
    container.attr("rotation", opts.rotation);
  }
  if (opts.scale) {
    container.attr("scale", opts.scale);
  }

  let d_normed = normalize(d);
  let rotation_string = rotation_vector([0, 1, 0], d);

  let shift = container
    .append("transform")
    .attr("translation", o.toString().replace(/,/g, " "));
  let rotation = shift.append("transform").attr("rotation", rotation_string);
  let recenter = rotation
    .append("transform")
    .attr("translation", `0 ${l / 2} 0`);

  let cyl = recenter.append("shape");
  let appearance = cyl.append("appearance");
  if (opts.sortKey || opts.sortKey === 0) {
    appearance.attr("sortKey", opts.sortKey);
  }
  let material = appearance
    .append("material")
    .attr("diffuseColor", `${color}`)
    .attr("transparency", transparency);
  cyl
    .append("cylinder")
    .attr("radius", `${r}`)
    .attr("height", `${l}`)
    .attr("bottom", opts.bottom)
    .attr("top", opts.top)
    .attr("subdivision", "64")
    .attr("solid", solid);

  let xs = [o[0], o[0] + l * d_normed[0]];
  let xmin = d3.min(xs.map((x) => x - r));
  let xmax = d3.max(xs.map((x) => x + r));
  let ys = [o[1], o[1] + l * d_normed[1]];
  let ymin = d3.min(ys.map((y) => y - r));
  let ymax = d3.max(ys.map((y) => y + r));
  let zs = [o[2], o[2] + l * d_normed[2]];
  let zmin = d3.min(zs.map((z) => z - r));
  let zmax = d3.max(zs.map((z) => z + r));

  let container_node = container.node();
  container_node.extent = {
    xmin: xmin,
    xmax: xmax,
    ymin: ymin,
    ymax: ymax,
    zmin: zmin,
    zmax: zmax
  };

  return container_node;
}
)}

function _create_torus(default_color,d3,normalize,rotation_vector){return(
function create_torus(o, n, R, r, opts = {}) {
  let { color = default_color, transparency = 0, solid = false } = opts;
  let container = d3.create("transform");
  if (opts.id) {
    container.attr("id", opts.id);
  }
  if (opts.class) {
    container.attr("class", opts.class);
  }

  let n_normed = normalize(n);
  let rotation_string = rotation_vector([0, 0, 1], n);
  // rotation_string = '0 0 0';

  let shift = container
    .append("transform")
    .attr("translation", o.toString().replace(/,/g, " "));
  let rotation = shift.append("transform").attr("rotation", rotation_string);
  // let recenter = rotation
  //   .append("transform")
  //   .attr("translation", `0 ${l / 2} 0`);

  let cyl = rotation.append("shape");
  let appearance = cyl.append("appearance");
  if (opts.sortKey || opts.sortKey === 0) {
    appearance.attr("sortKey", opts.sortKey);
  }
  let material = appearance
    .append("material")
    .attr("diffuseColor", `${color}`)
    .attr("transparency", transparency);
  cyl
    .append("torus")
    .attr("outerRadius", `${R}`)
    .attr("innerRadius", `${r}`)
    .attr("subdivision", "64,64")
    .attr("solid", solid);

  let xs = [o[0] - r - R, o[0] + r + R];
  let xmin = d3.min(xs.map((x) => x - r));
  let xmax = d3.max(xs.map((x) => x + r));
  let ys = [o[1] - r - R, o[1] + r + R];
  let ymin = d3.min(ys.map((y) => y - r));
  let ymax = d3.max(ys.map((y) => y + r));
  let zs = [o[2] - r - R, o[2] + r + R];
  let zmin = d3.min(zs.map((z) => z - r));
  let zmax = d3.max(zs.map((z) => z + r));

  let container_node = container.node();
  container_node.extent = {
    xmin: xmin,
    xmax: xmax,
    ymin: ymin,
    ymax: ymax,
    zmin: zmin,
    zmax: zmax
  };

  return container_node;
}
)}

function _create_arrow(normalize,rotation_vector,d3){return(
function create_arrow(o, d, opts = {}) {
  let {
    v_length = 1,
    h_length = 0.1,
    v_radius = 0.02,
    h_radius = 0.05,
    color = "0 0 0",
    transparency = 0
  } = opts;

  let d_normed = normalize(d);
  let rotation_string = rotation_vector([0, 1, 0], d);

  let container = d3.create("transform");
  if (opts.id) {
    container.attr("id", opts.id);
  }
  if (opts.class) {
    container.attr("class", opts.class);
  }
  let shift = container
    .append("transform")
    .attr("class", "translate_back")
    .attr("translation", o.toString().replace(/,/g, " "));
  let rotation = shift
    .append("transform")
    .attr("class", "rotate")
    .attr("rotation", rotation_string);
  let recenter = rotation
    .append("transform")
    .attr("class", "translate")
    .attr("translation", `0 ${v_length / 2} 0`);

  let arrow = recenter.append("group");
  let shaft = arrow.append("shape");
  shaft
    .append("appearance")
    .append("material")
    .attr("diffuseColor", `${color}`)
    .attr("emissiveColor", `${color}`)
    .attr("transparency", transparency);

  shaft
    .append("cylinder")
    .attr("radius", `${v_radius}`)
    .attr("height", `${v_length}`)
    .attr("subdivision", "16");
  let head_container = arrow
    .append("transform")
    .attr("translation", `0 ${v_length / 2} 0`);
  let head = head_container.append("shape");

  head.append("appearance").append("material").attr("diffuseColor", `${color}`)
    .attr("transparency", transparency);
  head
    .append("cone")
    .attr("bottomRadius", `${h_radius}`)
    .attr("topRadius", "0")
    .attr("height", `${h_length}`);

  let xs = [o[0], o[0] + v_length * d_normed[0]];
  let xmin = d3.min(xs);
  let xmax = d3.max(xs);
  let ys = [o[1], o[1] + v_length * d_normed[1]];
  let ymin = d3.min(ys);
  let ymax = d3.max(ys);
  let zs = [o[2], o[2] + v_length * d_normed[2]];
  let zmin = d3.min(zs);
  let zmax = d3.max(zs);

  let container_node = container.node();
  container_node.extent = {
    xmin: xmin,
    xmax: xmax,
    ymin: ymin,
    ymax: ymax,
    zmin: zmin,
    zmax: zmax
  };

  return container_node;
}
)}

function _create_axes(d3,create_viewpoint,create_arrow,create_text,width){return(
function create_axes(extent, opts = {}) {
  let { axes_origin = [0, 0, 0], label_rotation = "auto" } = opts;

  let ox, oy, oz;
  if (axes_origin == "auto") {
    ox = (extent.xmax + extent.xmin) / 2;
    oy = (extent.ymax + extent.ymin) / 2;
    oz = (extent.zmax + extent.zmin) / 2;
  } else {
    ox = axes_origin[0];
    oy = axes_origin[1];
    oz = axes_origin[2];
  }
  let max_extent = d3.max([
    extent.xmax - extent.xmin,
    extent.ymax - extent.ymin,
    extent.zmax - extent.zmin
  ]);

  if (label_rotation == "auto") {
    let viewpoint = create_viewpoint(extent);
    label_rotation = viewpoint.attr("orientation");
  }

  let axes = [
    create_arrow([1.1 * extent.xmin, oy, oz], [1, 0, 0], {
      v_length: 1.2 * (extent.xmax - extent.xmin),
      v_radius: max_extent / 400,
      h_radius: max_extent / 100,
      h_length: max_extent / 40
    }),
    create_arrow([ox, 1.1 * extent.ymin, oz], [0, 1, 0], {
      v_length: 1.2 * (extent.ymax - extent.ymin),
      v_radius: max_extent / 400,
      h_radius: max_extent / 100,
      h_length: max_extent / 40
    }),
    create_arrow([ox, oy, 1.1 * extent.zmin], [0, 0, 1], {
      v_length: 1.2 * (extent.zmax - extent.zmin),
      v_radius: max_extent / 400,
      h_radius: max_extent / 100,
      h_length: max_extent / 40
    }),
    create_text(
      "x",
      [1.1 * extent.xmax + max_extent / 7, oy - max_extent / 50, oz],
      {
        rotation: label_rotation,
        size: max_extent / 14,
        class: "label"
        // scale: "0.5 0.5 0.5"
      }
    ),
    create_text(
      "y",
      [ox - width / 10000, 1.1 * extent.ymax + max_extent / 7, max_extent / 50],
      {
        rotation: label_rotation,
        size: max_extent / 14,
        class: "label"
      }
    ),
    create_text("z", [ox, oy, 1.1 * extent.zmax + max_extent / 7], {
      rotation: label_rotation,
      size: max_extent / 14,
      class: "label"
    })
  ];
  return axes;
}
)}

function _create_viewpoint(d3){return(
function create_viewpoint(extent) {
  let viewpoint = d3.create("viewpoint");
  let extent_keys = Object.keys(extent);
  if (
    d3.sum(
      ["xmin", "xmax", "ymin", "ymax", "zmin", "zmax"].map((s) =>
        extent_keys.includes(s)
      )
    ) == 6
  ) {
    let xrange = extent.xmax - extent.xmin;
    let xcenter = (extent.xmax + extent.xmin) / 2;
    let yrange = extent.ymax - extent.ymin;
    let ycenter = (extent.ymax + extent.ymin) / 2;
    let zrange = extent.zmax - extent.zmin;
    let zcenter = (extent.zmax + extent.zmin) / 2;
    let range = 1.8 * d3.max([xrange, yrange, zrange]);

    let viewpoint_position = `${xcenter + range} ${ycenter + range / 3} ${
      zcenter + range / 3
    }`;
    viewpoint.attr("position", viewpoint_position);

    let viewpoint_orientation = "0.391878 0.543702 0.742173 2.1592"; //'0.90551 0.15022 0.39685 1.28733';
    viewpoint.attr("orientation", viewpoint_orientation);
    let viewpoint_centerOfRotation = `${xcenter} ${ycenter} ${zcenter}`;
    viewpoint.attr("centerOfRotation", viewpoint_centerOfRotation);
  }
  return viewpoint; //.node();
}
)}

function _create_transform(d3){return(
function create_transform(opts = {}) {
  let container = d3.create("transform");
  if (opts.id) {
    container.attr("id", opts.id);
  }
  if (opts.class) {
    container.attr("class", opts.class);
  }
  if (opts.translation) {
    container.attr("translation", opts.translation);
  }
  if (opts.rotation) {
    container.attr("rotation", opts.rotation);
  }
  if (opts.scale) {
    container.attr("scale", opts.scale);
  }
  if (opts.node) {
    container.append(() => opts.node);
  }

  let container_node = container.node();

  return container_node;
}
)}

function _pbcopy(){return(
function pbcopy(text) {
  const fake = document.body.appendChild(document.createElement("textarea"));
  fake.style.position = "absolute";
  fake.style.left = "-9999px";
  fake.setAttribute("readonly", "");
  fake.value = "" + text;
  fake.select();
  try {
    return document.execCommand("copy");
  } catch (err) {
    return false;
  } finally {
    fake.parentNode.removeChild(fake);
  }
}
)}

function _default_color(){return(
"0 0.2 0.4"
)}

function _d3(require){return(
require("d3@7")
)}

function _x3dom(require){return(
require("x3dom").catch(() => window["x3dom"])
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer("show_x3d")).define("show_x3d", ["width","d3","create_viewpoint","create_axes","x3dom","pbcopy"], _show_x3d);
  main.variable(observer("create_indexedFaceSet")).define("create_indexedFaceSet", ["d3","path_list_to_indexString","path_list_to_coordString"], _create_indexedFaceSet);
  main.variable(observer("create_indexedLineSet")).define("create_indexedLineSet", ["path_list_to_indexString","path_list_to_coordString","d3"], _create_indexedLineSet);
  main.variable(observer("create_box")).define("create_box", ["default_color","d3"], _create_box);
  main.variable(observer("create_sphere")).define("create_sphere", ["default_color","d3"], _create_sphere);
  main.variable(observer("create_text")).define("create_text", ["d3"], _create_text);
  main.variable(observer("create_pointSet")).define("create_pointSet", ["d3","pt_list_to_coordString"], _create_pointSet);
  main.variable(observer("create_cylinder")).define("create_cylinder", ["default_color","d3","normalize","rotation_vector"], _create_cylinder);
  main.variable(observer("create_torus")).define("create_torus", ["default_color","d3","normalize","rotation_vector"], _create_torus);
  main.variable(observer("create_arrow")).define("create_arrow", ["normalize","rotation_vector","d3"], _create_arrow);
  main.variable(observer("create_axes")).define("create_axes", ["d3","create_viewpoint","create_arrow","create_text","width"], _create_axes);
  main.variable(observer("create_viewpoint")).define("create_viewpoint", ["d3"], _create_viewpoint);
  main.variable(observer("create_transform")).define("create_transform", ["d3"], _create_transform);
  main.variable(observer("pbcopy")).define("pbcopy", _pbcopy);
  main.variable(observer("default_color")).define("default_color", _default_color);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  const child1 = runtime.module(define1);
  main.import("rotation_vector", child1);
  main.import("normalize", child1);
  main.import("path_list_to_indexString", child1);
  main.import("path_list_to_coordString", child1);
  main.import("pt_list_to_coordString", child1);
  main.variable(observer("x3dom")).define("x3dom", ["require"], _x3dom);
  return main;
}
