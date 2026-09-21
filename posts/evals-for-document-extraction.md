---
title: How We Build Evals for Document Extraction
date: 2026-09-03
slug: evals-for-document-extraction
description: |
  How to evaluate LLM-powered PDF extraction using exhaustive ground truth, synthetic documents, partial labels, and output validation.
image: /images/doc-extraction-evals/header.jpg
canonical: https://www.ode.com/engineering/evals-for-document-extraction
draft: true
---

*I originally wrote this post for the engineering blog at [Ode](https://www.ode.com), where it was [published on September 3, 2026](https://www.ode.com/engineering/evals-for-document-extraction).
I'm cross-posting it here so it lives alongside the rest of my writing.
The "we" throughout is the team at Ode.*

Our clients frequently come to us because they want to use LLMs to automate legacy workflows.
Health care, finance, banking -- all of these industries run on PDF files which, having been faxed or scanned, may not even contain a text layer.
A typical first step is extracting data from the PDF to feed into everything downstream, and the performance of the entire workload will be only as good as the data you managed to pull out during that pass.

If your extraction is not performing well, it doesn't matter how optimized your subsequent steps are.

However, extraction presents a unique challenge for evaluation, because there's often very little ground truth to measure against.
We've worked on a few of these projects, and this is how we think about understanding extraction performance.

## OCR to Extraction

It's common to refer to the process of turning a rasterized document format like a PDF with no text layer into a textual document as OCR -- optical character recognition.
OCR is one of the oldest problems where neural networks, the underlying architecture of today's LLMs, were used.
The original Perceptron in the 1950s was trained to recognize patterns of dots, and LeCun's work on digit recognition with LeNet produced MNIST, still one of the best-known eval datasets.

Today, you can use tools like Tesseract to perform decent OCR directly on your laptop, no LLMs required.
However, the OCR approach can be limited, especially on documents like medical records or financial forms, which encode a lot of information into the structure and layout of the content.
Turning a two-dimensional document into a one-dimensional string of words is a very lossy process, and it can be difficult to, for example, associate labels with values in the resulting textual output.

![One page of a rasterized diagnosis report beside the structured JSON an extractor produces from it, joined by an arrow labelled EXTRACT. The JSON holds typed facts with values, codes and dates rather than the text of the page.](/images/doc-extraction-evals/ocr-vs-extraction.png)

This is why we use the term *extraction* instead of OCR when we talk about this step.
Instead of asking an LLM to produce the **text content** of the document, we ask it instead to produce a structured output which contains the **information** in the document.
For instance, for a medical record processing task, you might ask the LLM to tell you all the clinical facts about a patient.
In the case of an application or form, you might ask for key-value pairs in the document.
This approach allows the LLM to use the spatial relationship between elements of the document to produce the desired set of facts.

## Exhaustive Labeling

Once you have a set of facts out of the document, the two numbers you want are **recall** and **precision**.
Recall asks what fraction of the facts in the document made it into your output: if the document contained 10 "facts" (more on what counts as a fact later) and the LLM produced 8 of them, recall is 80%.
Precision asks the reverse -- what fraction of the facts the LLM produced are actually in the document.
If it produced 10 facts and 2 of them aren't justified by anything on the page, precision is 80%.

To produce metrics like this, you would require what we call an "exhaustive labeling" of the document in question -- a one-to-one mapping between the document and the facts contained in it.
The exact mapping can be somewhat subjective, and might differ depending on the output you're asking the LLM to produce.
As a trivial example, the statement "the patient was smiling and laughing" might produce an equivalent output fact, or might be represented as two facts -- "the patient was smiling" and "the patient was laughing".
This is typical in all evals, and different human SMEs might produce different outputs if asked to label the same document.
What matters is that the labeling is as close to the "gold standard" as you can get it.

Unfortunately, getting such a labeling can be difficult.
A dense page of a medical records document might contain dozens to hundreds of facts.
We've seen counts exceeding 200 on an MAR (a Medication Administration Record), including patient information, lists of medication, days on which it was and was not administered, dosages, and by whom.
It takes humans a long time to produce a ground truth for such a document.
You can take a shortcut by asking an LLM or several LLMs to converge on a draft, and then doing a manual pass.
As you read each draft fact, either find it on the page and mark it, or delete the fact.
Then, see if any facts didn't make it, and add them to the draft.
Even this simplified process might take an hour a page.

![A diagnosis report page mid-labelling with three rows highlighted, beside the draft fact list being checked against it: lines marked found on the page, invented and deleted, or present on the page but missing from the draft.](/images/doc-extraction-evals/exhaustive-labeling-pass.png)

It's worth being concrete about why this is worth an hour a page.
On a badly degraded document, we watched one extractor return about 40 facts per page, nearly all tagged with a plausible fact type, and every one carrying a verbatim quote from the page.
Its actual recall was 9%.
The values had been assembled out of misread characters.
Fact counts, schema conformance, quote coverage all looked healthy.
We needed the hand labeled data to find the mistakes.

Since they give you the authoritative benchmarks for your system, you cannot avoid having at least a few such documents.
But given that their numbers will be limited, let's talk about a few tricks you can use to get reasonably good metrics on larger datasets.

## Synthetic Documents

What if you started with a set of facts, and *then* encoded them into a document?
This gives you an exhaustive labeling of the document by construction!
This approach is extremely useful for getting metrics over a large set of document types and formats.

The facts themselves can come from public datasets.
For instance, the [Synthea dataset](https://synthetichealth.github.io/index.html) contains millions of synthetic patient records.

You can also use LLMs to generate datasets full of totally fake facts, optimized for your specific target population or problem domain.
We recommend asking for facts in a format close to your extraction output format, to make comparison easier.
Two things are worth getting right: your synthetic dataset should be representative of the real one you'll encounter, and it should encode realistic defects.
How often are the facts you need actually missing from your documents?
How often do you get contradictory facts, and how does your system deal with them?

![A JSON fact set on the left and, joined by an arrow labelled RENDER, the same facts laid out as two different facility formats -- one tabular, one dot-leader.](/images/doc-extraction-evals/synthetic-facts-to-documents.png)

Synthetic datasets really shine when it comes to rendering your facts into documents.
For instance, suppose you are working with 100 different hospitals, each of which uses a different document format.
You can generate templates for all 100 formats, and encode the same facts into 100 different-looking documents to ensure your extraction performs well regardless of format.

The rendering stage is also a good moment to introduce additional defects.
Unlike the content-oriented defects created during fact generation, render defects exist to stress-test your extractor's visual reasoning.
Artifacts like rotation or pixelation test your extractor's ability to handle faxed or scanned documents that have undergone visual degradation.

![The same diagnosis report rendered three times and progressively degraded: clean at 0.7% character error, fax light at 4.5%, and fax heavy at 13.3%.](/images/doc-extraction-evals/render-defects-character-error.png)

It's also helpful to encode *pathologies*, which we define as something which makes a fact difficult to extract from a page even though it's present on the page.
For example, a fact on a page can be associated with a row and a column label, and all three must be considered to derive the fact accurately.
This fact might be present on page 2 of a document, and the header labeling the columns is only present on page 1.
These are all examples we've observed in real datasets; you would need to examine your own dataset to make a taxonomy of pathologies and then encode them into your rendering layer.

![Page 1 of a medication administration record with eight dated columns, above page 2 where the same grid continues without its header row, so nothing on the page says which date any column is.](/images/doc-extraction-evals/pathology-missing-header-row.png)

## Partial Labeling

You can still get value from human labeling without asking your SMEs to produce exhaustive labelings.
A common approach we use is to ask SMEs to give you just the most important facts from a document -- the ones that are most useful given the problem you're trying to solve with the document.
This approach has some advantages over exhaustive labeling, and can be used in combination with it.
For example, what if your recall is 95% against the ground truth, but the 5% you're missing contains all the most important bits?
A high score conceals an important shortcoming.

The big issue with partial labeling is that you cannot use it to measure precision.
Since not all the facts are known, you cannot say if a specific fact in the LLM output was omitted during labeling or hallucinated wholesale by the LLM.

## Ranking Without Labels

Both approaches so far cost something.
Labeling costs SME hours, and synthetic documents give you exact numbers on pages that aren't quite your pages.
There's a third option that needs no labels at all and runs on your real corpus, at the price of only giving you relative answers.

Run several extractors over the same documents -- different vendors, different models, different prompts.
Union all their outputs, dedupe by normalized quote, and you have a pseudo ground truth: the pool of facts somebody found.

Each extractor's recall is its share of the pool.
The pool can't contain facts every extractor missed, so you can't make absolute claims about recall -- only rank the extractors against one another.

You can estimate precision the same way.
A fact that two extractors found independently is probably real; a fact only one produced is worth a closer look.
Singletons cut both ways, though -- an extractor producing them alone is either hallucinating or the only one reading the page correctly.
If one extractor is generating most of the singletons and not winning on recall, treat it as a hallucination signal.

This pooled approach is most useful early, and helps you choose an extractor and get a better sense of your dataset.
Documents with lots of disagreement between extractors are worth a human look.

## Output Validation

If you used partial labelings for your metrics, you probably have a decent grasp on your workflow recall, but might be somewhat uncertain as to your precision.
We typically use two approaches to both measure precision and to keep hallucinated or ungrounded facts out of downstream workflow steps.

One approach involves measuring prevalence of hallucinated facts.
You can do this with either human labelers or by using an LLM-as-judge in an eval.
You're asking the question, "of these facts, which are actually contained in this document" -- basically, "please measure the precision of our workflow."

This approach is typically better suited for offline evals than production workflows.
The cost of extraction is dominated by tokenizing the PDF image into input tokens, so asking an LLM to re-read the document doubles your input token cost and latency.

The second approach is deterministic, and cheap enough to run on every document.
It starts at extraction time: alongside each fact, we ask the model for the verbatim quote from the page that supports it.
In parallel, we run a layout analysis of the document, which produces bounding boxes for the text on the page.
We can then match each fact's quote against the text in those boxes, which gives us both a check on the fact and a location for it.

A fact whose quote matches nothing gets disqualified.
It's worth being precise about what that means, though: a quote can fail to match because the model paraphrased instead of copying, because the OCR misread the source text, because the quote spans a line or column break -- or because the fact was invented.
Only the last one is a hallucination, so the disqualification rate is an upper bound on your hallucination rate rather than a measurement of it.
It's still a stable production signal, and it's one you can improve.
Run labeling exercises with human labelers or an LLM judge to find out which disqualified facts were really hallucinations, and use the results to tune the matcher.

![A report page with one row boxed, beside two fact records: one whose verbatim quote matched the layout pass and carries a page number and bounding box, and one whose quote matched nothing and is marked as unmatched.](/images/doc-extraction-evals/quote-matching-validation.png)

## Conclusion

Document extraction is more nuanced than it looks, but the complexity is tractable -- and most of it lives in the evaluation, not the extraction.
If you have a workflow that needs this kind of care to automate, [chat with the team at Ode](https://www.ode.com).

*Want to spend your time on problems like this one?
Ode is hiring* -- check out [Ode's careers page](https://www.ode.com/careers).
