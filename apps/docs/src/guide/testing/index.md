<script setup>
  import { data } from '../../versions.data'
  const { forc } = data
  const url = `https://fuellabs.github.io/sway/v${forc}/book/forc/commands/forc_test.html`
</script>

# Testing

In order to test your Sway and TS-SDK applications, you can test your code in a number of ways:

1. Testing with TS-SDK: Compiling you Sway code and connecting to the methods using TS-SDK and JS testing frameworks
2. Using `forc test` see <a :href="url" target="_blank" rel="noreferrer">the Sway docs</a> for more info
3. Using [the Rust SDK](https://fuellabs.github.io/fuels-rs/v0.31.1/testing/index.html)

## Testing with the TS-SDK

To test your Sway applications using the TS-SDK, you can pick whatever testing library or framework you feel comfortable with. There isn't any specific testing framework needed, it is entirely up to the user. That being said, the TS-SDK uses [Jest](https://jestjs.io/) for its tests.

### The `TestNodeLauncher` utility

To simplify testing of sway programs in isolation, the SDK provides `TestNodeLauncher`, a utility via which you can spin up a short-lived `fuel-core` node, setup a custom provider and wallets, and deploy contracts in one go.
Here is a simple contract deployment in a test:

<<< @/../../../packages/contract/src/test-utils/test-node-launcher.test.ts#TestNodeLauncher-deploy-contract{ts:line-numbers}

The code above spins up a `fuel-core` node on the first available port your machine provides, deploys your contract to that node, and returns the contract for you to test. After the `launched` variable goes out of scope, resource disposal is run and the node is killed.

You can also configure wallets and deploy multiple contracts with them:

<<< @/../../../packages/contract/src/test-utils/test-node-launcher.test.ts#TestNodeLauncher-multiple-contracts-and-wallets{ts:line-numbers}

#### Setting up a custom chain

The default chain config of `TestNodeLauncher` is the current beta network iteration's chain config. If you need a different chain config, you can specify a `DEFAULT_CHAIN_CONFIG_PATH` environment variable which points to your chain config. `TestNodeLauncher` will read that config and work with it instead. Note that it'll still create a second temporary file which will be the one given to the fuel-core node, but it'll be derived from the provided base file. This is because `TestNodeLauncher` adds coins and messages to the genesis block via `WalletConfig`.

<<< @/../../../packages/contract/src/test-utils/test-node-launcher.ts#TestNodeLauncher-custom-chain-config{ts:line-numbers}

Besides the chain config, you can provide arguments to the `fuel-core` node via the `nodeOptions.args` property. For a detailed list of all possible arguments run `fuel-core run --help`.
If you want _all_ your tests to run with the same config, consider specifying the `DEFAULT_FUEL_CORE_ARGS` environment variable. _Note: these args will be overriden in a test if `nodeOptions.args` is provided._

<<< @/../../../packages/contract/src/test-utils/test-node-launcher.ts#TestNodeLauncher-custom-fuel-core-args{ts:line-numbers}
