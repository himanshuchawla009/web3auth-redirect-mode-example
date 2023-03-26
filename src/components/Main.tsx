import { WALLET_ADAPTERS } from "@web3auth/base";
import { FormEvent } from "react";
import { useWeb3Auth } from "../services/web3auth";
import styles from "../styles/Home.module.css";

const Main = () => {
  const { provider, login, logout, getUserInfo, getAccounts, getBalance, signMessage, signTransaction, signAndSendTransaction, web3Auth, chain } = useWeb3Auth();
  const handleLoginWithEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = (e.target as any)[0].value
    login(WALLET_ADAPTERS.OPENLOGIN, "email_passwordless", email);
  }
  const loggedInView = (
    <>
      <button onClick={getUserInfo} className={styles.card}>
        Get User Info
      </button>
      <button onClick={getAccounts} className={styles.card}>
        Get Accounts
      </button>
      <button onClick={getBalance} className={styles.card}>
        Get Balance
      </button>
      <button onClick={signMessage} className={styles.card}>
        Sign Message
      </button>
      {
        (web3Auth?.connectedAdapterName === WALLET_ADAPTERS.OPENLOGIN || chain === "solana") &&
        (<button onClick={signTransaction} className={styles.card}>
          Sign Transaction
      </button>)
      }
      <button onClick={signAndSendTransaction} className={styles.card}>
        Sign and Send Transaction
      </button>
      <button onClick={logout} className={styles.card}>
        Log Out
      </button>

      <div className={styles.console} id="console">
        <p className={styles.code}></p>
      </div>
    </>
  );

  const unloggedInView = (
    <div>
      <form onSubmit={(e)=>handleLoginWithEmail(e)}  className={styles.centerFlex}>
      <hr/>
        <input type={'email'} placeholder={'Enter your email'} className={styles.input} />
        <button type="submit" className={styles.card}>Login With Email</button>
      </form>
    </div>
  );

  return <div className={styles.grid}>{provider ? loggedInView : unloggedInView}</div>;
};

export default Main;
