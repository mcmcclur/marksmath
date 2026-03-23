import numpy as np
import matplotlib.pyplot as plt


def synthetic_logistic():
    np.random.seed(1)

    # Parameters
    n = 200
    mu = 55
    sigma = 20

    # Generate x values
    x = np.random.normal(loc=mu, scale=sigma, size=n)

    # Logistic function (as specified)
    def logistic(x):
        return 1 / (1 + np.exp(-0.108 * (x - 55)))

    # Compute probabilities
    p = logistic(x)

    # Generate binary outcomes
    y = np.random.binomial(1, p)


    # Plot
    plt.figure(figsize=(9, 4))

    # Logistic curve
    # x_curve = np.linspace(min(x)-5, max(x)+5, 400)
    # y_curve = logistic(x_curve)
    # plt.plot(x_curve, y_curve)

    # Scatter plot of data
    plt.scatter(x, y, alpha=0.4)


    # Axes at origin
    ax = plt.gca()
    ax.spines['left'].set_position('zero')
    ax.spines['bottom'].set_position('zero')

    # Hide top/right spines
    ax.spines['right'].set_color('none')
    ax.spines['top'].set_color('none')

    # Dashed line at y = 1
    plt.axhline(y=1, linestyle='--')

    # Labels
    plt.xlabel('Flips')
    plt.ylabel('Arthritis')

    # Limits for better view
    plt.ylim(-0.1, 1.1)
    plt.xlim(-1,111)

    plt.show()