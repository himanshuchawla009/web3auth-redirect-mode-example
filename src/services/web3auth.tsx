import { ADAPTER_EVENTS, SafeEventEmitterProvider, WALLET_ADAPTERS, WALLET_ADAPTER_TYPE } from "@web3auth/base";
import { Web3AuthNoModal as Web3Auth } from "@web3auth/no-modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { createContext, FunctionComponent, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { CHAIN_CONFIG, CHAIN_CONFIG_TYPE } from "../config/chainConfig";
import { WEB3AUTH_NETWORK_TYPE } from "../config/web3AuthNetwork";
import { getWalletProvider, IWalletProvider } from "./walletProvider";

export interface IWeb3AuthContext {
  web3Auth: Web3Auth | null;
  provider: IWalletProvider | null;
  isLoading: boolean;
  user: unknown;
  chain: string;
  login: (adapter: WALLET_ADAPTER_TYPE, provider: string, login_hint?: string) => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<any>;
  signMessage: () => Promise<any>;
  getAccounts: () => Promise<any>;
  getBalance: () => Promise<any>;
  signTransaction: () => Promise<void>;
  signAndSendTransaction: () => Promise<void>;
}

export const Web3AuthContext = createContext<IWeb3AuthContext>({
  web3Auth: null,
  provider: null,
  isLoading: false,
  user: null,
  chain: "",
  login: async () => {},
  logout: async () => {},
  getUserInfo: async () => {},
  signMessage: async () => {},
  getAccounts: async () => {},
  getBalance: async () => {},
  signTransaction: async () => {},
  signAndSendTransaction: async () => {},
});

export function useWeb3Auth(): IWeb3AuthContext {
  return useContext(Web3AuthContext);
}

interface IWeb3AuthState {
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  chain: CHAIN_CONFIG_TYPE;
  children?: React.ReactNode;
}
interface IWeb3AuthProps {
  children?: ReactNode;
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  chain: CHAIN_CONFIG_TYPE;
}

const clientId = "BKPxkCtfC9gZ5dj-eg-W6yb5Xfr3XkxHuGZl2o2Bn8gKQ7UYike9Dh6c-_LaXlUN77x0cBoPwcSx-IVm0llVsLA";


export const Web3AuthProvider: FunctionComponent<IWeb3AuthState> = ({ children, web3AuthNetwork, chain }: IWeb3AuthProps) => {
  const [web3Auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IWalletProvider | null>(null);
  const [user, setUser] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setWalletProvider = useCallback(
    (web3authProvider: SafeEventEmitterProvider) => {
      const walletProvider = getWalletProvider(chain, web3authProvider, uiConsole);
      setProvider(walletProvider);
    },
    [chain]
  );

  const getOpenloginAdapter = (uxMode: "redirect" | "sessionless_redirect") => {
    const adapter = new OpenloginAdapter({
      adapterSettings: {
        network: "cyan",
        clientId,
        uxMode,
      },
    });
    return adapter;
  }

  const currentChainConfig = CHAIN_CONFIG[chain];

  const subscribeAuthEvents = (web3auth: Web3Auth) => {
    // Can subscribe to all ADAPTER_EVENTS and LOGIN_MODAL_EVENTS
    web3auth.on(ADAPTER_EVENTS.CONNECTED, (data: unknown) => {
      console.log("Yeah!, you are successfully logged in", data);
      setUser(data);
      setWalletProvider(web3auth.provider!);
    });

    web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
      console.log("connecting");
    });

    web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
      console.log("disconnected");
      setUser(null);
    });

    web3auth.on(ADAPTER_EVENTS.ERRORED, (error: any) => {
      console.error("some error or user has cancelled login request", error);
    });
  };

  const isLoggedIn = () => {
    const openloginStore = localStorage.getItem('openlogin_store');
    return openloginStore && JSON.parse(openloginStore).sessionId && JSON.parse(openloginStore).idToken
  }
  const configureAndGetWeb3AuthInstance = async () => {
    const web3AuthInstance = new Web3Auth({
      chainConfig: currentChainConfig,
      // get your client id from https://dashboard.web3auth.io
      clientId,
      enableLogging: true,
      web3AuthNetwork: "cyan"
    });
    const sessionAdapter = getOpenloginAdapter("redirect")
    const sessionLessAdapter = getOpenloginAdapter("sessionless_redirect")

    // if user is logged in thn use the session redirect mode
    if (isLoggedIn()) {
      debugger
      web3AuthInstance.configureAdapter(sessionAdapter)
      subscribeAuthEvents(web3AuthInstance)
      // initialize async
      await web3AuthInstance.init();
    } else {
      // if user is not logged in use sessionless redirect mode for fast login
      // but at the same time initialize session in a async way
      debugger
      web3AuthInstance.configureAdapter(sessionLessAdapter)
      subscribeAuthEvents(web3AuthInstance)
      await web3AuthInstance.init();

      const web3AuthInstanceWithSession = new Web3Auth({
        chainConfig: currentChainConfig,
        // get your client id from https://dashboard.web3auth.io
        clientId,
        enableLogging: true,
        web3AuthNetwork: "cyan"
      });
      web3AuthInstanceWithSession.configureAdapter(sessionAdapter)
      // initialize async
      web3AuthInstanceWithSession.init();
    }
    return web3AuthInstance

  }

  useEffect(() => {


    async function init() {
      try {
        setIsLoading(true);
        const web3AuthInstance = await configureAndGetWeb3AuthInstance();
        setWeb3Auth(web3AuthInstance)
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [chain, web3AuthNetwork, setWalletProvider]);

  const login = async (adapter: WALLET_ADAPTER_TYPE, loginProvider: string, login_hint?: string) => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    const localProvider = await web3Auth.connectTo(adapter, { loginProvider, extraLoginOptions: {
      login_hint,
    }});
    setWalletProvider(localProvider!);
  };

  const logout = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3Auth.logout();
    setProvider(null);
  };

  const getUserInfo = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    const user = await web3Auth.getUserInfo();
    uiConsole(user);
  };

  const getAccounts = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await provider.getAccounts();
  };

  const getBalance = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await provider.getBalance();
  };

  const signMessage = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await provider.signMessage();
  };

  const signTransaction = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await provider.signTransaction();
  };

  const signAndSendTransaction = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await provider.signAndSendTransaction();
  };

  const uiConsole = (...args: unknown[]): void => {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  };

  const contextProvider = {
    web3Auth,
    chain,
    provider,
    user,
    isLoading,
    login,
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
    signMessage,
    signTransaction,
    signAndSendTransaction,
  };
  return <Web3AuthContext.Provider value={contextProvider}>{children}</Web3AuthContext.Provider>;
};
