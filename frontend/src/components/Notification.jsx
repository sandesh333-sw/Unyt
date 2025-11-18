import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const Alert = withReactContent(Swal);

export const notify = {
  success: (msg) =>
    Alert.fire({
      icon: "success",
      title: msg,
      timer: 2000,
      showConfirmButton: false,
    }),

  error: (msg) =>
    Alert.fire({
      icon: "error",
      title: "Error",
      text: msg,
      timer: 2000,
      showConfirmButton: false,
    }),

  info: (msg) =>
    Alert.fire({
      icon: "info",
      title: msg,
      timer: 2000,
      showConfirmButton: false,
    })
};
