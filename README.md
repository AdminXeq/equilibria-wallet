# Equilibria Electron GUI Wallet

### Introduction
A Private and Decentralized Oracle Solution

More information on the project can be found on the [website](https://equilibriacc.com). Equilibria is an open source project, and we encourage contributions from anyone with something to offer.


### About this project

This is the new electron GUI for Equilibria. It is open source and completely free to use without restrictions, anyone may create an alternative implementation of the Equilibria Electron GUI that uses the protocol and network in a compatible manner.

Please submit any changes as pull requests to the development branch, all changes are assessed in the development branch before being merged to master, release tags are considered stable builds for the GUI.

#### Pre-requisites
- Download latest [Equilibria](https://github.com/EquilibriaCC/Equilibria)
- Windows only: Set execution policy to [Unrestricted]((If you are on windows, set your execution policy to Unrestricted (https://docs.vmware.com/en/vRealize-Automation/7.6/com.vmware.vra.iaas.hp.doc/GUID-9670AFC5-76B8-4321-822A-BCE05800DB5B.html)).

#### Commands
```
nvm use 14.27.3
npm install -g quasar-cli
git clone https://github.com/EquilibriaCC/equilibria-wallet -b development
cd equilibria-wallet
cp path_to_equilibria_binaries/daemon bin/
cp path_to_equilibria_binaries/equilibria-wallet-rpc bin/
npm install

brew install perl (macOS)
pip3 install ds-store (macOS)

//build options
npm run build

"build": "quasar build -m electron -t mat",
"build-mac-x64": "quasar build -m electron -t mat --mac --x64",
"build-mac-arm64": "quasar build -m electron -t mat --mac --arm64",
"build-windows": "quasar build -m electron -t mat --win",
"build-armv7": "quasar build -m electron -t mat --linux --armv7l",
"build-armv8": "quasar build -m electron -t mat --linux --arm64",

//dev
quasar dev -m electron -t mat

```
