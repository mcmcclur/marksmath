// Inference code copied from BlogMarksMath/posts/NeuralMultiplier/components/neural_multiplier.js.
// Classes to define a simple neural network
class Neuron {
  constructor(weights, bias, activation) {
    this.weights = weights;
    this.bias = bias;
    this.activation = activation;
  }

  compute(inputs) {
    const z = this.weights.reduce(
      (sum, w, i) => sum + w * inputs[i],
      this.bias
    );
    const a = this.activationFunc(z);
    return { z, a };
  }

  get activationFunc() {
    return this.activation === "tanh" ? tanh : linear;
  }
}

// Layer class
class Layer {
  constructor(config, activation) {
    this.neurons = config.map(
      (n) => new Neuron(n.weights, n.bias, activation)
    );
    this.activation = activation;
  }

  compute(inputs) {
    return this.neurons.map((neuron) => neuron.compute(inputs));
  }
}

// Network class
export class Network {
  constructor(model) {
    this.layers = model.layers.map(
      (layer) => new Layer(layer.neurons, layer.activation)
    );
  }

  forward(input) {
    const result = [];
    let currentInput = input;

    for (const layer of this.layers) {
      const layerOutput = layer.compute(currentInput);
      const activations = layerOutput.map(({ a }) => a);
      result.push({
        z: layerOutput.map(({ z }) => z),
        a: activations
      });
      currentInput = activations;
    }

    return result;
  }
}



function tanh(x) {
  return Math.tanh(x);
}

function linear(x) {
  return x;
}

