/** Checked official guidance, not an NSF form or an eligibility decision. */
export const NSF_RESUBMISSION_PROFILE={
  id:"nsf-resubmission-preparation",version:1,checkedOn:"2026-10-25",
  sources:[
    {title:"NSF PAPPG current-guide index",url:"https://www.nsf.gov/policies/pappg",finding:"The index identifies PAPPG 24-1 as current and lists Supplements 1 and 2. Check the applicable solicitation and notices for the actual target."},
    {title:"NSF PAPPG 24-1, Chapter IV.E",url:"https://www.nsf.gov/policies/pappg/24-1/ch-4-non-award-decisions-transactions",finding:"NSF expects substantial revision addressing major concerns and applies ordinary new-proposal review procedures. Program-specific waiting restrictions may apply."},
  ],
  questions:["Confirm the original proposal/program and decline or review status.","Check the target solicitation, deadline and relevant notices.","Check program-specific waiting-period or moratorium instructions.","Confirm whether and where a response or changes summary belongs.","Explain substantive changes for internal review."],
  notice:"Internal NSF preparation profile. Confirm sponsor application type separately from project lineage. This workflow neither creates a sponsor response attachment nor certifies eligibility or scientific adequacy.",
} as const;
