import * as yup from "yup";

const regFormValidationSchema = yup.object().shape({
  name: yup
    .string()
    .required("Name is required")
    .matches(/^[A-Za-z\s]+$/, "Name without special characters")
    .max(20, "Name must be less than 20 characters"),

  email: yup
    .string()
    .required("Email is required")
    .matches(/^[A-Za-z]/, "Email must start with a letter")
    .email("Invalid email address"),

  phone: yup
    .string()
    .required("Phone number is required")

    //No letters allowed
    .matches(/^[0-9]+$/, "Phone number must contain digits only")

    // 8 digits
    .length(8, "Phone number must be exactly 8 digits")

    //start with 2, 7, or 9
    .matches(
      /^[279]/,
      "Phone number must start with 9, 2, or 7"
    ),

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /[@$!%*?&#^()_\-+=]/,
      "Password must contain at least one special character"
    ),

  confirmPassword: yup
    .string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

export default regFormValidationSchema;
