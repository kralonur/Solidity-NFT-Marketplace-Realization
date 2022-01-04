/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface NftMarketplaceInterface extends utils.Interface {
  functions: {
    "buyItem(uint256)": FunctionFragment;
    "cancel(uint256)": FunctionFragment;
    "createItem(string)": FunctionFragment;
    "getTrade(uint256)": FunctionFragment;
    "listItem(uint256,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "buyItem",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "cancel",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "createItem", values: [string]): string;
  encodeFunctionData(
    functionFragment: "getTrade",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "listItem",
    values: [BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "buyItem", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "cancel", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "createItem", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getTrade", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "listItem", data: BytesLike): Result;

  events: {
    "TradeStateChanged(uint256,uint8)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "TradeStateChanged"): EventFragment;
}

export type TradeStateChangedEvent = TypedEvent<
  [BigNumber, number],
  { tradeId: BigNumber; state: number }
>;

export type TradeStateChangedEventFilter =
  TypedEventFilter<TradeStateChangedEvent>;

export interface NftMarketplace extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: NftMarketplaceInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    buyItem(
      tradeId: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    cancel(
      tradeId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    createItem(
      tokenURI: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getTrade(
      tradeId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber, BigNumber, string, number] & {
        createdAt: BigNumber;
        stateChangedAt: BigNumber;
        item: BigNumber;
        price: BigNumber;
        seller: string;
        state: number;
      }
    >;

    listItem(
      item: BigNumberish,
      price: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  buyItem(
    tradeId: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  cancel(
    tradeId: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  createItem(
    tokenURI: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getTrade(
    tradeId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber, BigNumber, string, number] & {
      createdAt: BigNumber;
      stateChangedAt: BigNumber;
      item: BigNumber;
      price: BigNumber;
      seller: string;
      state: number;
    }
  >;

  listItem(
    item: BigNumberish,
    price: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    buyItem(tradeId: BigNumberish, overrides?: CallOverrides): Promise<void>;

    cancel(tradeId: BigNumberish, overrides?: CallOverrides): Promise<void>;

    createItem(tokenURI: string, overrides?: CallOverrides): Promise<void>;

    getTrade(
      tradeId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber, BigNumber, string, number] & {
        createdAt: BigNumber;
        stateChangedAt: BigNumber;
        item: BigNumber;
        price: BigNumber;
        seller: string;
        state: number;
      }
    >;

    listItem(
      item: BigNumberish,
      price: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "TradeStateChanged(uint256,uint8)"(
      tradeId?: BigNumberish | null,
      state?: null
    ): TradeStateChangedEventFilter;
    TradeStateChanged(
      tradeId?: BigNumberish | null,
      state?: null
    ): TradeStateChangedEventFilter;
  };

  estimateGas: {
    buyItem(
      tradeId: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    cancel(
      tradeId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    createItem(
      tokenURI: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getTrade(
      tradeId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    listItem(
      item: BigNumberish,
      price: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    buyItem(
      tradeId: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    cancel(
      tradeId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    createItem(
      tokenURI: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getTrade(
      tradeId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    listItem(
      item: BigNumberish,
      price: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
