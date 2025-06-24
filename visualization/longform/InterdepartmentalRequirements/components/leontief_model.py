import numpy as np

def leontief_model(G):
    nodes = G.nodes()
    M = []
    for source in nodes: #G.nodes():
        row = []
        for target in nodes: #G.nodes():
            if (source, target) in G.edges():
                row.append(int(G.get_edge(source, target).attr['penwidth']))
            else:
                row.append(0)
        M.append(row)
    M = np.array(M)
    n = M.shape[0]
    

    # Step 1: Normalize columns to get input-output coefficients
    column_sums = M.sum(axis=0)
    A_leontief = np.divide(M, column_sums, where=column_sums != 0)
    

    # Step 2: Compute (I - A)^(-1)
    I = np.eye(n)
    # try:
    leontief_inverse = np.linalg.inv(I - A_leontief)
    # except np.linalg.LinAlgError:
    #     raise ValueError("Matrix (I - A) is singular and cannot be inverted.")

    # Step 3: Final demand vector (assume 1 for each department)
    d = np.ones(n)

    # Step 4: Total output vector
    x = leontief_inverse @ d
    x_normalized = x / np.nanmax(x)

    # Step 5: Sorted ranking
    dept_indices_sorted = np.argsort(-x_normalized)
    dept_ranking = [(int(i), float(x_normalized[i]), nodes[i]) for i in dept_indices_sorted]

    return dept_ranking
    


import numpy as np

def leontief_model1(G):
    """
    Compute Leontief-style importance scores from a department input-output matrix.

    Parameters:
    - M (array-like): A square matrix (NumPy array or list of lists) where M[i, j]
                      represents the number of courses from department i required for majors in department j.

    Returns:
    - dept_ranking: A list of tuples (department_index, normalized_importance_score),
                    sorted from most to least important.
                    If the computation fails, returns all-zero scores.
    """

    M = []
    for source in G.nodes():
        row = []
        for target in G.nodes():
            if (source, target) in G.edges():
                row.append(int(G.get_edge(source, target).attr['penwidth']))
            else:
                row.append(0)
        M.append(row)
    M = np.array(M)
    n = M.shape[0]

    # Check squareness
    if M.shape[0] != M.shape[1]:
        raise ValueError("Matrix must be square.")

    n = M.shape[0]

    # Step 1: Normalize columns (avoid divide-by-zero)
    column_sums = M.sum(axis=0)
    with np.errstate(divide='ignore', invalid='ignore'):
        A_leontief = np.divide(M, column_sums, where=column_sums != 0)
        A_leontief = np.nan_to_num(A_leontief, nan=0.0, posinf=0.0, neginf=0.0)

    # Step 2: Compute (I - A)^(-1)
    I = np.eye(n)
    try:
        leontief_inverse = np.linalg.inv(I - A_leontief)
    except np.linalg.LinAlgError:
        return [(i, 0.0) for i in range(n)]

    # Step 3: Compute total output vector
    d = np.ones(n)
    x = leontief_inverse @ d
    x = np.nan_to_num(x, nan=0.0, posinf=0.0, neginf=0.0)

    # Step 4: Normalize
    max_x = np.max(x)
    if max_x <= 0 or not np.isfinite(max_x):
        x_normalized = np.zeros_like(x)
    else:
        x_normalized = x / max_x

    # Step 5: Rank results
    dept_indices_sorted = np.argsort(-x_normalized)
    dept_ranking = [(int(i), float(x_normalized[i])) for i in dept_indices_sorted]

    return dept_ranking
