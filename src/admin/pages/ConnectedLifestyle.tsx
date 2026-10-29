import { useRouter } from "../router";
import EditorialWorkspace from "./EditorialWorkspace";
export default function ConnectedLifestyle() {
  const { route } = useRouter();
  return (
    <EditorialWorkspace
      key={"lifestyle:" + (route.parts[0] ?? "list")}
      id={route.parts[0]}
      resource="lifestyle"
    />
  );
}
