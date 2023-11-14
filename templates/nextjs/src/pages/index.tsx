import { Connect } from "@/components/Connect";
import type { TestContractAbi } from "@/sway-api";
import { TestContractAbi__factory } from "@/sway-api";
import contractIds from "@/sway-api/contract-ids.json";
import { Provider, Wallet, bn } from "fuels";
import { Inter } from "next/font/google";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });
const contractId = contractIds.testContract;

export default function Home() {
  const [contract, setContract] = useState<TestContractAbi>();
  const [valueA, setValueA] = useState<number>();
  const [valueB, setValueB] = useState<number>();
  const [returnedValue, setReturnedValue] = useState<number>();

  useEffect(() => {
    (async () => {
      const provider = await Provider.create("http://127.0.0.1:4000/graphql");
      const wallet = Wallet.fromPrivateKey("0x01", provider);
      const testContract = TestContractAbi__factory.connect(contractId, wallet);
      setContract(testContract);
      // eslint-disable-next-line no-console
    })().catch(console.error);
  }, []);

  const onTestFunctionCalled = async () => {
    if (!contract) {
      // eslint-disable-next-line no-alert
      return alert("Contract not loaded");
    }
    const { value } = await contract.functions
      .test_function(bn(valueA), bn(valueB))
      .call();

    setReturnedValue(value);

    return value;
  };

  return (
    <main
      className={`flex min-h-screen flex-col items-center p-24 ${inter.className}`}
    >
      <Connect />

      <hr className="border border-slate-200 w-8/12 my-6" />

      <h3>Contract ID: {contractId}</h3>

      <input
        type="number"
        placeholder="Enter number A"
        value={valueA}
        onChange={(e) => setValueA(Number(e.target.value))}
        className="px-4 py-2 border border-slate-200 rounded-md my-6"
      />
      <input
        type="number"
        placeholder="Enter number B"
        onChange={(e) => setValueB(Number(e.target.value))}
        className="px-4 py-2 border border-slate-200 rounded-md my-2"
      />

      <button
        onClick={onTestFunctionCalled}
        className="
        px-4 py-2 bg-slate-500 text-white rounded-md
        hover:bg-slate-600 transition-colors duration-200
        mt-4
      "
      >
        Call `test_function` and get sum
      </button>

      {returnedValue && (
        <p className="mt-4">Returned value: {returnedValue.toString()}</p>
      )}
    </main>
  );
}
