---
title: Data Boundary Layer for HTMX with Zod
date: 2025-11-14
slug: zod-schemas-htmx
description: |
  My experience creating a data boundary layer with Zod in Hono and HTMX.
image: /images/abstract-data-parsing-quilt.png
---

The last few months, I've been working on [CSheet](https://www.csheet.net), my LLM-assisted DnD-5e character sheet tracker.
You know that old chestnut about how AI is easy and AV is hard?
I've had that same experience, but with incoming data parsing.

I was expecting that a challenging bit would be designing, for example, a good data flow with `htmx`.
Or maybe I would run into problems integrating complicated UI components (e.g. an image cropper) into a vanilla-JS app, given the dominance of front-end frameworks like React.
Also, I had never integrated an LLM into a product, and expected this to also be difficult.

Instead, the piece that I've ended up iterating on the most has to do with how to receive and process incoming data.
I wanted to leave a few breadcrumbs here for anyone who comes after (or, let's face it, their LLM agents).

## React: The Usual Sitch

These days most web apps are written in React, and React has a somewhat-smaller data representation surface area, at least for incoming data.
It's of course impossible to avoid the browser's data representation, which is full of quirks.
For instance, numeric input elements are represented in the browser as strings, so you have to deal with converting between `"5"` and `5`.
Incomplete inputs are `""`.
Checkboxes are `"on"` when checked, unless there's a `value` , and they're totally missing when unchecked.
`multiple` inputs are just multiple key-value pairs.

In React apps, you usually try to parse the browser's `FormData` representation into JSON as soon as possible.
Your APIs then accept JSON, which is sensible and has numbers, booleans, arrays, and objects.
On the server-side, you're usually still validating that the JSON's *shape* conforms to your expected shape.
But you're not dealing with the nitty-gritty of turning a boolean string `"true"`, which might be missing, into the boolean value `true`.
That step happens right next to the data, in the browser.

Note that for outgoing data, the situation is quite reversed.
In REST APIs, you might have a dozen representations of your internal objects for specific API purposes.
GraphQL is an attempt to deal with an exploding number of statically-defined representations, and it solves the problem by creating an unbounded number of dynamic representations.
In server-side rendered apps, you might be passing the exact same internal representation to all your view-rendering logic, although sometimes you still get an explosion for different permissions structures.
But I digress...

## Parsing `FormData`

When you're dealing with browser-submitted forms, you have to deal with `multipart/form-data`-encoded request bodies.
This is a string representation containing a bunch of `key=value` pairs, which you're going to want to turn into some kind of object.
This step can be somewhat arcane; it's underspecified, and usually left to framework conventions.

For instance, let's say you have `<select multiple name="fruit">` in your form, and the user only selects `apple`.
You get `fruit=apple` in your request body.
Ruby's [rack](https://github.com/rack/rack) will turn this into an object like `params.fruit = "apple"`.
What if the user select both `apple` and `orange`?
Well, in that case you'll get `params.fruit = ["apple", "orange"]`!
You can solve this problem by using `name="fruit[]"` instead, which `rack` uses as a hint to remove the `[]` and always turn `fruit` into an array.
This is pure convention -- the `[]` have no meaning outside the request parsing logic in that stack.
Your favorite stack might also do this, but you don't know unless you look it up.

In Hono, the situation is actually even more annoying.
You would typically use [`parseBody`](https://hono.dev/docs/api/request#parsebody), which returns `Record<string, string | File>`.
If your user selects `apple` and `orange`, you'll get `params.fruit = "orange"`, totally dropping the `apple`.
You should invoke `parseBody({ all: true })` instead, in which case you'll get a `Record<string, string | | File | (string | File)[]>`.
You don't need to add `[]` to your input `name`s -- Hono ignores this convention, and since it doesn't strip the `[]` you'll end up with inconvenient field names in your objects.
Then there's also `{ dot: true }`, which treats `.` as special in your field names and turns dot-separated fields into nested objects.

## Zod and Service Representation

In your services, you will probably want to use objects with sensible types.
For instance, you might want something like:

```ts
const dietSchema = z.object({
    fruit: z.array(z.enum(["apple" | "banana" | "orange"])).min(1),
    perDay: z.number().int().positive()
})
```

This will produce a type like:

```ts
type DietSchemaT = {
  fruit: ("apple" | "banana" | "orange")[],
  perDay: Number,
}
```

To get from your `parseBody` representation to this typed representation, you have to both parse and validate.
For example, `perDay` might be any of:

* (happy path) a string containing a number, like `"5"`
* an empty string `""`
* some random string `"bob"`
* something else totally unexpected

I took several stabs at this problem in CSheet.
Initially, I split up my validation and submission logic.
I had my validation run on the unparsed schema, which is a `Record<string, ...>` type.
This meant doing a bunch of parsing directly in validation.
For example, I might do something like:

```ts
if (body.perDay) {
  const perDay = parseInt(body.perDay, 10)
  if (isNaN(perDay)) {
    errors.perDay = "Invalid number"
```

Then in my submission logic, I would attempt to parse using the `zod` schema, turning any parsing errors into form errors.
And my business logic operated on the parsed service schema.
This is obviously a lot of duplication.

In version 2, I unified validation and submission.
I added an `is_check` parameter to all my requests, representing either a request to validate or perform the submission.
Both began with attempting to parse the request body using the `zod` schema.
This meant I could lean on `zod` to perform the parsing:

```ts
type DietSchemaT = {
  perDay: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) {
      return null
    }
    if (typeof val === "string") {
      const num = Number(val)
      return isNaN(num) ? val : num;
    }
    return val
  }, z.number().int().positive())
}
```

There's a lot of common patterns here, so I eventually factored these out into what I call [`formSchemas`](https://github.com/igor47/csheet/blob/main/src/lib/formSchemas.ts).

When validating, an empty form field is not an error -- it just means the user hasn't gotten to the form field yet.
To deal with this, my version-2 schema definitions/service logic had two features:

* I actually parsed twice -- for validation, using the [`partial`](https://zod.dev/api#partial) version of the schema
* Since `zod` doesn't well-represent `z.preprocess(method, schema).optional()`, I had to embed optionality into my `schema`

This eventually let me to V3: just define the schema the way it *should* be.
Arguably, I should have done this from the beginning.
I still wanted to avoid displaying errors on missing fields after validation.
But I realized I could do this when rendering the form.
If the field has an error, I now check if (a) we were validating (vs submitting) the form and (b) the field is blank.
If both of those are true, I [ignore the error](https://github.com/igor47/csheet/blob/06df22002c79c2fad32388c98f3762e6d5871e07/src/lib/formErrors.ts#L67-L85).

## Re-rendering the Form

After validation, we re-render the form for `htmx`, possibly containing new fields or errors.
We want to pass the user's answers back to the component, so that the form can be rendered with the old answers populated.
We have at least 3 choices for which representation to pass to the form component:

1. generate a `FormData` from the string encoding
2. the version we get from `parseBody`
3. the parsed version we get inside the service

I went back and forth several times on which representation to use.
It's tempting to use (3), the typed service representation.
It's strongly typed, and it seems somehow more correct to pass around a `{ perDay: Number }` type than a `Record<string, unknown>` type.

However, using the typed representation in form rendering meant converting values back to their `FormData` types.
I would have to do `value={String(values.perDay)}`.
Also, if parsing fails, I don't actually have a typed representation to use!

I eventually settled on using (2) as the least of all evils.
It's an object, so for forms with nested fields or arrays I can at least do sensible iteration to render the form.
It also has the benefit of containing exactly what the user input, avoiding the unexpected UX of your values changing for you.

## LLM Representation

Since I have an LLM assistant with tool calling embedded into the system, my incoming request data might also be generated by the LLM instead of a form.
I use [Vercel AI](https://ai-sdk.dev/) to interface with LLMs, and it accepts `zod` schemas to create descriptions for LLM tool-calling.
Making the schemas strict/non-optional helped tighten up what the LLM generates.
Now, a field is marked optional only if it's actually optional in the tool call -- not because it might be optional during validation.

For `zod`, there's a distinction between input and output schemas.
My output schema is the strongly typed representation the service operates on.
When I give this schema to the LLM, it generates strongly-typed (JSON) tool calls.
However, my *input* schema is implicitly written to consider the output of browser forms.
As a result, since I perform schema parsing *inside* the service, I unfortunately have to convert the LLM's strongly-typed tool call into a "stringly"-typed input for the service.
The strings are then immediately parsed back into the strongly-typed representation.
There might be a good way to handle this, probably by parsing the form data outside the main service function, but I'm not sure if the added complexity is worth it.

## Takeaways

After three iterations, I landed on a pattern that works well:
- Define schemas as they **should be** for your services (strict, typed, non-optional)
- Use `zod.preprocess` to handle the string→type conversions from `FormData`
- Handle validation-vs-submission differences at render time, not in the schema

The same schemas work for both browser forms and LLM tool calls, which has been a fortunate convergence.
I do find myself missing `pydantic`, which feels more ergonomic for parsing data thanks to its default coercion
However, `zod`'s `preprocess` works, and is definitely more explicit. 

I've factored the common patterns into [`formSchemas.ts`](https://github.com/igor47/csheet/blob/main/src/lib/formSchemas.ts).
If there's interest in packaging this as a standalone library, ping me on [the issue](https://github.com/igor47/csheet/issues/57).
