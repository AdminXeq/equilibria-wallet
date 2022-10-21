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
nvm install v16.18.0
npm i -g npm@latest
npm i -g quasar-cli
git clone https://github.com/EquilibriaCC/equilibria-wallet -b development
cd equilibria-wallet && mkdir -p bin
cp path_to_equilibria_binaries/daemon bin/
cp path_to_equilibria_binaries/equilibria-wallet-rpc bin/
```
##### macOS specific only
```
brew install perl
python -m pip install ds-store
npm install
npm run build-mac-x64 (for x86_64 mac) / npm run build-mac-arm64 (for Apple Silicon M1 and M2 mac)
```

##### ARMv7 specific linux build options
```
npm install --arch=armv7l
npm run --arch=armv7l build-armv7
```

##### ARMv8 / aarch64 / ARM64 specific linux build options
```
npm install --arch=arm64
npm run --arch=arm64 build-armv8
```

##### Other platforms build options
```
npm install
npm run build
```

##### Development build
```
npm install
npm run dev
```
