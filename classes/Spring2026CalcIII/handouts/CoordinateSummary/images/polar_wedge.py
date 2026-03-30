import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Arc, FancyArrowPatch

# --------------------------------------------------
# Parameters
# --------------------------------------------------
a = 3
b = 6
alpha = np.deg2rad(30)
beta  = np.deg2rad(75)

# how far the bounding rays extend beyond the outer arc
ray_extension = 0.9

# --------------------------------------------------
# Helpers
# --------------------------------------------------
def pol2cart(r, theta):
    return r * np.cos(theta), r * np.sin(theta)

# --------------------------------------------------
# Geometry
# --------------------------------------------------
theta = np.linspace(alpha, beta, 400)

x_inner, y_inner = pol2cart(a, theta)
x_outer, y_outer = pol2cart(b, theta)

r_arrow = b + ray_extension
x_ray1_end, y_ray1_end = pol2cart(r_arrow, alpha)
x_ray2_end, y_ray2_end = pol2cart(r_arrow, beta)

theta_mid = 0.5 * (alpha + beta)

def make_polar_wedge():
    fig, ax = plt.subplots(figsize=(6, 5))

    # Annular sector boundaries in black
    ax.plot(x_inner, y_inner, lw=2, color="black")
    ax.plot(x_outer, y_outer, lw=2, color="black")

    # Bounding rays with arrows
    arrow_style = dict(arrowstyle="->", mutation_scale=14, lw=2, color="black")
    ax.add_patch(FancyArrowPatch((0, 0), (x_ray1_end, y_ray1_end), **arrow_style))
    ax.add_patch(FancyArrowPatch((0, 0), (x_ray2_end, y_ray2_end), **arrow_style))

    # Optional light fill for the sector
    ax.fill(
        np.concatenate([x_outer, x_inner[::-1]]),
        np.concatenate([y_outer, y_inner[::-1]]),
        color="lightgray",
        alpha=0.25,
        zorder=0
    )

    # --------------------------------------------------
    # Labels for r = a and r = b
    # --------------------------------------------------
    xa, ya = pol2cart(a + 0.18, theta_mid)
    xa = xa + 0.2
    xb, yb = pol2cart(b + 0.18, theta_mid)
    xb = xb + 0.2

    ax.text(xa, ya, r"$r=a$", fontsize=14, ha="center", va="center")
    ax.text(xb, yb, r"$r=b$", fontsize=14, ha="center", va="center")

    # --------------------------------------------------
    # Angular arcs WITH arrowheads
    # --------------------------------------------------
    def arc_arrow(theta_end, radius, rad_sign=1.0):
        """
        Draw a curved arrow from angle 0 to theta_end at given radius.
        rad_sign controls curvature direction (positive = CCW bow).
        """
        x0, y0 = pol2cart(radius, 0)
        x1, y1 = pol2cart(radius, theta_end)

        return FancyArrowPatch(
            (x0, y0), (x1, y1),
            connectionstyle=f"arc3,rad={rad_sign * 0.35}",
            arrowstyle="->",
            mutation_scale=12,
            lw=1.5,
            color="black"
        )

    arc_r1 = 1.5
    arc_r2 = 2

    # Add curved arrows
    ax.add_patch(arc_arrow(alpha, arc_r1, rad_sign=1))
    ax.add_patch(arc_arrow(beta,  arc_r2, rad_sign=1))

    # Labels
    x_alpha_lbl, y_alpha_lbl = pol2cart(arc_r1 + 0.2, alpha / 2)
    x_alpha_lbl = x_alpha_lbl - 0.13
    x_beta_lbl,  y_beta_lbl  = pol2cart(arc_r2 + 0.2, beta / 2)
    x_beta_lbl = x_beta_lbl + 0.25
    y_beta_lbl = y_beta_lbl - 0.8

    ax.text(x_alpha_lbl, y_alpha_lbl, r"$\theta=\alpha$",
            fontsize=14, ha="right", va="top")
    ax.text(x_beta_lbl, y_beta_lbl, r"$\theta=\beta$",
            fontsize=14, ha="left", va="center")

    # --------------------------------------------------
    # Custom axes from the origin (no box axes)
    # --------------------------------------------------
    axis_len = r_arrow + 0.5

    ax.add_patch(FancyArrowPatch((0, 0), (axis_len, 0),
                                arrowstyle="->", mutation_scale=14,
                                lw=1.5, color="black"))
    ax.add_patch(FancyArrowPatch((0, 0), (0, axis_len),
                                arrowstyle="->", mutation_scale=14,
                                lw=1.5, color="black"))

    ax.text(axis_len + 0.08, 0, r"$x$", fontsize=14, ha="left", va="center")
    ax.text(0, axis_len + 0.08, r"$y$", fontsize=14, ha="center", va="bottom")

    # --------------------------------------------------
    # Final formatting
    # --------------------------------------------------
    ax.set_aspect("equal")
    ax.axis("off")

    xmin = -0.6
    xmax = axis_len + 0.4
    ymin = -0.6
    ymax = axis_len + 0.4

    ax.set_xlim(xmin, xmax)
    ax.set_ylim(ymin, ymax)

    plt.show()
