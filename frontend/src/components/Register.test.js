import { render, screen, fireEvent as fire } from "@testing-library/react";
import "@testing-library/jest-dom";
import Register from "./Register";


jest.mock("react-redux", () => {
  const actual = jest.requireActual("react-redux");
  return {
    ...actual,
    useSelector: (selectorFn) =>
      selectorFn({
        auth: { status: "idle", error: null }, 
      }),
    useDispatch: () => jest.fn(),
  };
});

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => jest.fn(),
    Link: ({ children, ...rest }) => <a {...rest}>{children}</a>,
  };
});

jest.mock("../store/authSlice", () => {
  return {
    __esModule: true,

    registerUser: () => ({ type: "auth/registerUser" }),
  };
});


describe("Register component - password validation", () => {
  test("shows password error when password is too short", async () => {
    render(<Register />);

    fire.change(screen.getByPlaceholderText("Name"), {
      target: { value: "Aya" },
    });

    fire.change(screen.getByPlaceholderText("Email"), {
      target: { value: "aya@example.com" },
    });

    fire.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Ab1@" }, 
    });

    fire.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "Ab1@" },
    });

   
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    fire.click(submitButton);

  
    const errorMessage = await screen.findByText(
      "Password must be at least 8 characters"
    );

    expect(errorMessage).toBeInTheDocument();
  });
});
