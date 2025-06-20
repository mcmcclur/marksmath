import {parse, compile, evaluate} from 'https://cdn.jsdelivr.net/npm/mathjs@10.6.4/+esm';

export function parse_form(input_form) {
  let a, a_tex, a_success;
  try {
    a_tex = parse(input_form.a).toTex();
    a = evaluate(input_form.a);
    if (a != undefined) {
      a_success = true;
    }
  } catch (e) {
    a_success = false;
  }
  let b, b_tex, b_success;
  try {
    b_tex = parse(input_form.b).toTex();
    b = evaluate(input_form.b);
    if (b != undefined) {
      b_success = true;
    }
  } catch (e) {
    b_success = false;
  }

  let f_parsed, f_tex, f;
  let f_success = true;
  try {
    try {
      f_tex = parse(input_form.f).toTex();
      f_parsed = compile(input_form.f);
      f = (x) => f_parsed.evaluate({ x: x });
    } catch (e1) {
      f_success = false;
    }
    f(1);
  } catch (e2) {
    f_success = false;
  }

  let fx;
  let f_ready = true;
  try {
    fx = f((a + b) / 2);
  } catch {
    f_ready = false;
  }
  if (f_ready) {
    f_ready = !isNaN(fx) || fx === 0;
  }
  return {
    f_ready: f_ready,
    f_success: f_success,
    f_tex: f_tex,
    f: f,
    a_success: a_success,
    a_tex: a_tex,
    a: a,
    b_success: b_success,
    b_tex: b_tex,
    b: b
  };
}
