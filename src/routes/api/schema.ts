import { Type } from "@sinclair/typebox";

const HeadersSchema = Type.Object(
  {
    authorization: Type.String(),
  },
  { $id: "HeadersSchema" }
);

export { HeadersSchema };
