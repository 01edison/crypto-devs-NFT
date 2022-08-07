import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useRef, useState, useEffect } from "react";
import { providers, Contract, utils } from "ethers";
import Web3Modal from "web3modal";
import {
  CRYPTODEVS_CONTRACT_ABI,
  CRYPTODEVS_CONTRACT_ADDRESS,
} from "../constants/constants";

export default function Home() {
  const [isOwner, setIsOwner] = useState(false);
  const [numMinted, setNumMinted] = useState(0);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConneted] = useState(false);
  const [loading, setLoading] = useState(false);
  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needsigner = false) => {
    try {
      // we need to gain access to the provider/signer from Metamask
      const providerInstance = await web3ModalRef.current.connect(); //this will pop open metamask

      const web3provider = new providers.Web3Provider(providerInstance);

      // if the user is not connected to rinkeby, tell them to connect to rinkeby

      const { chainId } = await web3provider.getNetwork();
      if (chainId !== 4) {
        alert("Please connect to the rinkeby network");
        throw new Error("Please connect to the rinkeby network");
      }

      if (needsigner) {
        const signer = web3provider.getSigner();

        return signer;
      }
      return web3provider;
    } catch (error) {
      console.log(error);
      throw new Error("User refused to connect wallet");
    }
  };

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const cryptoDevsContract = new Contract(
        CRYPTODEVS_CONTRACT_ADDRESS,
        CRYPTODEVS_CONTRACT_ABI,
        signer
      );

      const owner = await cryptoDevsContract.owner(); //returns the address of the contract owner (person that deployed the contract)
      const userAddress = await signer.getAddress(); // user that's currently signed in

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const startPresale = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const cryptoDevsContract = new Contract(
        CRYPTODEVS_CONTRACT_ADDRESS,
        CRYPTODEVS_CONTRACT_ABI,
        signer
      );
      const txn = await cryptoDevsContract.startPresale();

      await txn.wait();
      setPresaleStarted(true);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner(); // get the provider

      //instantiate the contract
      const cryptoDevsContract = new Contract(
        CRYPTODEVS_CONTRACT_ADDRESS,
        CRYPTODEVS_CONTRACT_ABI,
        provider
      );

      const isPresaleStarted = await cryptoDevsContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);
      return isPresaleStarted;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      const cryptoDevsContract = new Contract(
        CRYPTODEVS_CONTRACT_ADDRESS,
        CRYPTODEVS_CONTRACT_ABI,
        provider
      );
      const presaleEndTime = await cryptoDevsContract.presaleEnded(); //this will return a big number and also time stamp in seconds

      const currentTimeInSeconds = Date.now() / 1000;

      const hasPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );
      setPresaleEnded(hasPresaleEnded);
    } catch (error) {
      console.log(error);
    }
  };

  const presaleMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const cryptoDevsContract = new Contract(
        CRYPTODEVS_CONTRACT_ADDRESS,
        CRYPTODEVS_CONTRACT_ABI,
        signer
      );
      const txn = await cryptoDevsContract.presaleMint({
        value: utils.parseEther("0.001"),
      });

      await txn.wait();
      alert("You successfully minted a crypto devs NFT!!");
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const publicMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const cryptoDevsContract = new Contract(
        CRYPTODEVS_CONTRACT_ADDRESS,
        CRYPTODEVS_CONTRACT_ABI,
        signer
      );
      const txn = await cryptoDevsContract.mint({
        value: utils.parseEther("0.002"),
      });

      await txn.wait();

      alert("You successfully minted a crypto devs NFT!!");
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const getNumOfMintedNfts = async () => {
    try {
      const provider = await getProviderOrSigner();

      const cryptoDevsContract = new Contract(
        CRYPTODEVS_CONTRACT_ADDRESS,
        CRYPTODEVS_CONTRACT_ABI,
        provider
      );

      const numMintedNfts = await cryptoDevsContract.tokenIds();

      setNumMinted(numMintedNfts.toString());
    } catch (error) {
      console.log(error);
    }
  };
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      //Update "walletConnected" to true
      setWalletConneted(true);
    } catch (error) {
      console.log(error);
    }
  };

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();
    if (presaleStarted) {
      await checkIfPresaleEnded();
    }
    await getNumOfMintedNfts();

    //track if its the owner viewing the page

    setInterval(async () => {
      await getOwner();
    }, 2000)

    //track number of minted NFTs in real time
    setInterval(async () => {
      await getNumOfMintedNfts();
    }, 5000);

    // track the presale status in real time
    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();

      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5000);
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      onPageLoad();
    }
  }, []);

  function renderBody() {
    //if wallet isnt connected
    if (!walletConnected) {
      return (
        <button className={styles.button} onClick={connectWallet}>
          Connect Wallet
        </button>
      );
    }

    //if its the owner and presale has not started
    if (isOwner && !presaleStarted) {
      return (
        <>
          {loading? <div>Loading....</div>:<button className={styles.button} onClick={startPresale}>
            Start Presale
          </button>}
          
        </>
      );
    }

    // if presale has not started, come back later
    if (!presaleStarted) {
      return (
        <>
          <div className={styles.description}>
            Presale is yet to start come back later
          </div>
        </>
      );
    }

    // if presale has started and not ended yet
    if (presaleStarted && !presaleEnded) {
      // allow presale mint
      // only for whitelisted users
      return (
        <>
          <div>
            <div className={styles.description}>
              Presale has started! Only whitelisted addresses can mint at
              0.001ETH
            </div>
            {loading ? (
              <div className={styles.description}>Loading...</div>
            ) : (
              <button className={styles.button} onClick={presaleMint}>
                Mint!
              </button>
            )}
          </div>
          <img src="crypto-devs.svg" className={styles.image} />
        </>
      );
    }

    if (presaleEnded) {
      // allow users to take part in public sale

      return (
        <>
          <div>
            <div className={styles.description}>
              Presale has Ended! Mint a CryptoDev NFT for 0.002ETH
            </div>

            {loading ? (
              <div className={styles.description}>Loading...</div>
            ) : (
              <button className={styles.button} onClick={publicMint}>
                Mint!
              </button>
            )}
          </div>
        </>
      );
    }
  }
  return (
    <>
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs NFT</h1>
          <span className={styles.description}>
            Crypto devs NFT for web3 developers
          </span>
          <p>{numMinted}/20 NFTs already Minted</p>
          {renderBody()}
        </div>
        <img src="/cryptodevs/0.svg" className={styles.image} />
      </div>
      <footer className={styles.footer}>Made with &#10084; by Edison!</footer>
    </>
  );
}
