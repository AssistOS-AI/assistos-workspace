const sidebarItems = [
    {
        name: "Settings",
        icon: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
            "<g clip-path=\"url(#clip0_4571_1768)\">\n" +
            "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M7.79112 5.38477C6.24886 5.38477 5.00391 6.62972 5.00391 8.17198C5.00391 9.71423 6.24886 10.9592 7.79112 10.9592C9.33337 10.9592 10.5783 9.71423 10.5783 8.17198C10.5783 6.62972 9.33337 5.38477 7.79112 5.38477ZM5.93298 8.17198C5.93285 7.67904 6.12855 7.20625 6.47702 6.85761C6.82549 6.50896 7.29818 6.31303 7.79112 6.31291C8.28405 6.31278 8.75684 6.50848 9.10548 6.85695C9.45413 7.20542 9.65006 7.67811 9.65019 8.17105C9.65025 8.41512 9.60223 8.65682 9.50888 8.88234C9.41554 9.10786 9.27869 9.31278 9.10614 9.48541C8.9336 9.65804 8.72874 9.795 8.50327 9.88846C8.27779 9.98192 8.03612 10.0301 7.79205 10.0301C7.54797 10.0302 7.30627 9.98216 7.08075 9.88882C6.85523 9.79547 6.65031 9.65862 6.47768 9.48607C6.12903 9.1376 5.9331 8.66491 5.93298 8.17198Z\" fill=\"#2A92AF\"/>\n" +
            "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M7.78989 0.740234C6.76791 0.740234 5.93175 1.57175 5.93175 2.59837V2.66155C5.9313 2.74587 5.90593 2.82818 5.85881 2.89811C5.81169 2.96804 5.74494 3.02247 5.66696 3.05455C5.59051 3.08669 5.50624 3.09538 5.42484 3.07949C5.34345 3.06361 5.26861 3.02388 5.20986 2.96536C4.87467 2.6304 4.42019 2.44224 3.94632 2.44224C3.47246 2.44224 3.01798 2.6304 2.68279 2.96536L2.58152 3.06755C2.24656 3.40275 2.0584 3.85722 2.0584 4.33109C2.0584 4.80496 2.24656 5.25943 2.58152 5.59462C2.63986 5.6533 2.67947 5.72797 2.69535 5.80917C2.71123 5.89038 2.70265 5.97447 2.67071 6.0508C2.63857 6.12893 2.584 6.19578 2.51389 6.2429C2.44377 6.29003 2.36126 6.31532 2.27679 6.31558H2.21361C1.7208 6.31558 1.24817 6.51135 0.899705 6.85982C0.551236 7.20829 0.355469 7.68091 0.355469 8.17372C0.355469 8.66653 0.551236 9.13916 0.899705 9.48763C1.24817 9.83609 1.7208 10.0319 2.21361 10.0319H2.27679C2.44681 10.0319 2.60382 10.1359 2.67071 10.2966C2.70286 10.3731 2.71154 10.4574 2.69566 10.5388C2.67977 10.6202 2.64005 10.695 2.58152 10.7537C2.24656 11.0889 2.0584 11.5434 2.0584 12.0173C2.0584 12.4912 2.24656 12.9456 2.58152 13.2808L2.68279 13.383C3.38052 14.0798 4.51306 14.0798 5.20986 13.383C5.26851 13.3243 5.34329 13.2844 5.42469 13.2684C5.50609 13.2523 5.59043 13.2609 5.66696 13.2929C5.82676 13.3598 5.93175 13.5159 5.93175 13.6868V13.75C5.93175 14.2428 6.12751 14.7154 6.47598 15.0639C6.82445 15.4124 7.29708 15.6081 7.78989 15.6081C8.28269 15.6081 8.75532 15.4124 9.10379 15.0639C9.45226 14.7154 9.64802 14.2428 9.64802 13.75V13.6868C9.64802 13.5168 9.75208 13.3598 9.91281 13.2929C9.98926 13.2608 10.0735 13.2521 10.1549 13.268C10.2363 13.2838 10.3112 13.3236 10.3699 13.3821C11.0676 14.0798 12.2002 14.0798 12.897 13.3821L12.9983 13.2808C13.3332 12.9456 13.5214 12.4912 13.5214 12.0173C13.5214 11.5434 13.3332 11.0889 12.9983 10.7537C12.9397 10.695 12.9 10.6202 12.8841 10.5388C12.8682 10.4574 12.8769 10.3731 12.9091 10.2966C12.9412 10.2185 12.9958 10.1517 13.0659 10.1045C13.136 10.0574 13.2185 10.0321 13.303 10.0319H13.3643C13.8571 10.0319 14.3297 9.83609 14.6782 9.48763C15.0267 9.13916 15.2224 8.66653 15.2224 8.17372C15.2224 7.68091 15.0267 7.20829 14.6782 6.85982C14.3297 6.51135 13.8571 6.31558 13.3643 6.31558H13.3021C13.2176 6.31532 13.1351 6.29003 13.065 6.2429C12.9948 6.19578 12.9403 6.12893 12.9081 6.0508C12.876 5.97435 12.8673 5.89007 12.8832 5.80868C12.8991 5.72728 12.9388 5.65245 12.9973 5.5937C13.3323 5.2585 13.5204 4.80403 13.5204 4.33016C13.5204 3.85629 13.3323 3.40182 12.9973 3.06663L12.8961 2.96536C12.5609 2.6304 12.1064 2.44224 11.6325 2.44224C11.1587 2.44224 10.7042 2.6304 10.369 2.96536C10.3102 3.02388 10.2354 3.06361 10.154 3.07949C10.0726 3.09538 9.98833 3.08669 9.91188 3.05455C9.83375 3.02241 9.7669 2.96784 9.71978 2.89772C9.67265 2.82761 9.64736 2.7451 9.6471 2.66062V2.59837C9.6471 1.5764 8.81651 0.740234 7.78989 0.740234ZM6.86082 2.59837C6.86082 2.35197 6.9587 2.11566 7.13293 1.94142C7.30717 1.76719 7.54348 1.6693 7.78989 1.6693C8.03629 1.6693 8.2726 1.76719 8.44684 1.94142C8.62107 2.11566 8.71896 2.35197 8.71896 2.59837V2.66155C8.71896 3.2097 9.05249 3.70211 9.55698 3.9158C10.0587 4.12298 10.644 4.01056 11.0249 3.62407C11.1041 3.54451 11.1982 3.48139 11.3018 3.43831C11.4054 3.39524 11.5166 3.37306 11.6288 3.37306C11.741 3.37306 11.8522 3.39524 11.9558 3.43831C12.0594 3.48139 12.1535 3.54451 12.2327 3.62407L12.334 3.72626C12.4945 3.8881 12.5846 4.10683 12.5846 4.33481C12.5846 4.56278 12.4945 4.78151 12.334 4.94335C12.1458 5.13187 12.0178 5.37194 11.966 5.63322C11.9142 5.8945 11.9411 6.16526 12.0432 6.41128C12.2522 6.91576 12.7455 7.2493 13.2974 7.2493H13.3597C13.6061 7.2493 13.8424 7.34718 14.0166 7.52142C14.1908 7.69565 14.2887 7.93196 14.2887 8.17837C14.2887 8.42477 14.1908 8.66108 14.0166 8.83532C13.8424 9.00955 13.6061 9.10744 13.3597 9.10744H13.2974C13.0292 9.1085 12.7671 9.18855 12.5441 9.33758C12.321 9.48661 12.1468 9.69803 12.0432 9.94546C11.8351 10.4472 11.9475 11.0325 12.334 11.4134C12.6684 11.7479 12.6684 12.2914 12.334 12.6212L12.2327 12.7224C12.1535 12.802 12.0594 12.8651 11.9558 12.9082C11.8522 12.9513 11.741 12.9735 11.6288 12.9735C11.5166 12.9735 11.4054 12.9513 11.3018 12.9082C11.1982 12.8651 11.1041 12.802 11.0249 12.7224C10.8364 12.5343 10.5963 12.4062 10.335 12.3545C10.0738 12.3027 9.803 12.3296 9.55698 12.4316C9.30883 12.5343 9.09673 12.7083 8.94754 12.9315C8.79836 13.1548 8.7188 13.4174 8.71896 13.6859V13.7472C8.71896 13.9936 8.62107 14.2299 8.44684 14.4042C8.2726 14.5784 8.03629 14.6763 7.78989 14.6763C7.54348 14.6763 7.30717 14.5784 7.13293 14.4042C6.9587 14.2299 6.86082 13.9936 6.86082 13.7472V13.685C6.85975 13.4167 6.77971 13.1547 6.63067 12.9316C6.48164 12.7086 6.27022 12.5344 6.02279 12.4307C5.77677 12.3286 5.50602 12.3018 5.24474 12.3535C4.98346 12.4053 4.74339 12.5334 4.55486 12.7215C4.4757 12.8011 4.3816 12.8642 4.27796 12.9073C4.17432 12.9504 4.0632 12.9725 3.95097 12.9725C3.83874 12.9725 3.72761 12.9504 3.62398 12.9073C3.52034 12.8642 3.42624 12.8011 3.34707 12.7215L3.24581 12.6193C3.08524 12.4575 2.99515 12.2388 2.99515 12.0108C2.99515 11.7828 3.08524 11.5641 3.24581 11.4022C3.43396 11.2137 3.56202 10.9736 3.61378 10.7124C3.66554 10.4511 3.63868 10.1803 3.5366 9.93431C3.43383 9.68633 3.25979 9.47443 3.03652 9.32542C2.81325 9.1764 2.55079 9.09699 2.28236 9.09722H2.21918C1.97278 9.09722 1.73647 8.99933 1.56223 8.8251C1.388 8.65086 1.29011 8.41455 1.29011 8.16815C1.29011 7.92174 1.388 7.68543 1.56223 7.5112C1.73647 7.33696 1.97278 7.23908 2.21918 7.23908H2.28236C2.55062 7.23801 2.81262 7.15797 3.03567 7.00894C3.25873 6.8599 3.43295 6.64848 3.5366 6.40106C3.74472 5.89936 3.6323 5.31404 3.24581 4.93313C3.16625 4.85396 3.10312 4.75986 3.06005 4.65622C3.01697 4.55259 2.9948 4.44146 2.9948 4.32923C2.9948 4.217 3.01697 4.10587 3.06005 4.00224C3.10312 3.8986 3.16625 3.8045 3.24581 3.72534L3.34707 3.62314C3.50891 3.46258 3.72764 3.37248 3.95561 3.37248C4.18359 3.37248 4.40232 3.46258 4.56415 3.62314C4.75258 3.81145 4.9926 3.93968 5.25388 3.99161C5.51516 4.04353 5.78598 4.01683 6.03208 3.91487C6.53657 3.70583 6.87011 3.21249 6.87011 2.66062V2.59837H6.86082Z\" fill=\"#4B4B4B\"/>\n" +
            "</g>\n" +
            "<defs>\n" +
            "<clipPath id=\"clip0_4571_1768\">\n" +
            "<rect width=\"14.8651\" height=\"14.8651\" fill=\"white\" transform=\"translate(0.359375 0.740234)\"/>\n" +
            "</clipPath>\n" +
            "</defs>\n" +
            "</svg>"
    },
    {
      name:"Themes",
        icon:"<svg width=\"16\" height=\"17\" viewBox=\"0 0 16 17\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
            "<path d=\"M9.34375 4.01562V6.18361C9.34375 6.28507 9.38463 6.38239 9.45741 6.45414C9.53018 6.52588 9.62888 6.56619 9.7318 6.56619H11.9308\" stroke=\"#4B4B4B\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n" +
            "<path d=\"M5.28932 4.99023C5.12142 4.99023 4.96039 5.05693 4.84167 5.17566C4.72295 5.29438 4.65625 5.4554 4.65625 5.6233C4.65625 5.7912 4.72295 5.95222 4.84167 6.07094C4.96039 6.18967 5.12142 6.25636 5.28932 6.25636H10.3538C10.5217 6.25636 10.6828 6.18967 10.8015 6.07094C10.9202 5.95222 10.9869 5.7912 10.9869 5.6233C10.9869 5.4554 10.9202 5.29438 10.8015 5.17566C10.6828 5.05693 10.5217 4.99023 10.3538 4.99023H5.28932ZM4.65625 8.16632C4.65625 7.99842 4.72295 7.8374 4.84167 7.71868C4.96039 7.59996 5.12142 7.53326 5.28932 7.53326H10.3538C10.5217 7.53326 10.6828 7.59996 10.8015 7.71868C10.9202 7.8374 10.9869 7.99842 10.9869 8.16632C10.9869 8.33422 10.9202 8.49524 10.8015 8.61397C10.6828 8.73269 10.5217 8.79939 10.3538 8.79939H5.28932C5.12142 8.79939 4.96039 8.73269 4.84167 8.61397C4.72295 8.49524 4.65625 8.33422 4.65625 8.16632ZM5.28932 10.0763C5.12142 10.0763 4.96039 10.143 4.84167 10.2617C4.72295 10.3804 4.65625 10.5414 4.65625 10.7093C4.65625 10.8772 4.72295 11.0383 4.84167 11.157C4.96039 11.2757 5.12142 11.3424 5.28932 11.3424H10.3538C10.5217 11.3424 10.6828 11.2757 10.8015 11.157C10.9202 11.0383 10.9869 10.8772 10.9869 10.7093C10.9869 10.5414 10.9202 10.3804 10.8015 10.2617C10.6828 10.143 10.5217 10.0763 10.3538 10.0763H5.28932Z\" fill=\"#4B4B4B\"/>\n" +
            "<path d=\"M7.85514 9.26826C8.28396 9.26826 8.69522 9.10031 8.99844 8.80136C9.30166 8.50241 9.47201 8.09695 9.47201 7.67417C9.47201 7.25139 9.30166 6.84593 8.99844 6.54698C8.69522 6.24803 8.28396 6.08008 7.85514 6.08008C7.42633 6.08008 7.01507 6.24803 6.71185 6.54698C6.40863 6.84593 6.23828 7.25139 6.23828 7.67417C6.23828 8.09695 6.40863 8.50241 6.71185 8.80136C7.01507 9.10031 7.42633 9.26826 7.85514 9.26826Z\" stroke=\"#4B4B4B\" stroke-width=\"2\" stroke-linejoin=\"round\"/>\n" +
            "<path d=\"M2.23047 13.8991V4.97209C2.23047 4.71842 2.33268 4.47514 2.51461 4.29577C2.69655 4.11639 2.9433 4.01563 3.2006 4.01562H9.50771C9.61059 4.01571 9.70923 4.05608 9.78193 4.12785L11.8179 6.13515C11.8541 6.17079 11.8828 6.21314 11.9023 6.25976C11.9219 6.30638 11.9319 6.35634 11.9317 6.40678V13.8991C11.9317 14.1527 11.8295 14.396 11.6476 14.5754C11.4657 14.7548 11.2189 14.8555 10.9616 14.8555H3.2006C2.9433 14.8555 2.69655 14.7548 2.51461 14.5754C2.33268 14.396 2.23047 14.1527 2.23047 13.8991Z\" stroke=\"#4B4B4B\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n" +
            "</svg>\n"

    },
    {
        name: "Pages",
        icon: "<svg width=\"16\" height=\"17\" viewBox=\"0 0 16 17\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
            "<path d=\"M4.81641 12.3058H9.34366M4.81641 9.75522H5.46316M4.81641 7.20465H6.75666M4.81641 2.10352H10.9605L13.8709 4.9729V12.9434\" stroke=\"#4B4B4B\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n" +
            "<path d=\"M2.23047 13.8991V4.97209C2.23047 4.71842 2.33268 4.47514 2.51461 4.29577C2.69655 4.11639 2.9433 4.01563 3.2006 4.01562H9.50771C9.61059 4.01571 9.70923 4.05608 9.78193 4.12785L11.8179 6.13515C11.8541 6.17079 11.8828 6.21314 11.9023 6.25976C11.9219 6.30638 11.9319 6.35634 11.9317 6.40678V13.8991C11.9317 14.1527 11.8295 14.396 11.6476 14.5754C11.4657 14.7548 11.2189 14.8555 10.9616 14.8555H3.2006C2.9433 14.8555 2.69655 14.7548 2.51461 14.5754C2.33268 14.396 2.23047 14.1527 2.23047 13.8991Z\" stroke=\"#4B4B4B\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n" +
            "<path d=\"M9.34375 4.01562V6.18361C9.34375 6.28507 9.38463 6.38239 9.45741 6.45414C9.53018 6.52588 9.62888 6.56619 9.7318 6.56619H11.9308\" stroke=\"#4B4B4B\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n" +
            "</svg>\n"
    },
    {
        name: "Menu",
        icon: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
            "<path d=\"M5.28932 4.99023C5.12142 4.99023 4.96039 5.05693 4.84167 5.17566C4.72295 5.29438 4.65625 5.4554 4.65625 5.6233C4.65625 5.7912 4.72295 5.95222 4.84167 6.07094C4.96039 6.18967 5.12142 6.25636 5.28932 6.25636H10.3538C10.5217 6.25636 10.6828 6.18967 10.8015 6.07094C10.9202 5.95222 10.9869 5.7912 10.9869 5.6233C10.9869 5.4554 10.9202 5.29438 10.8015 5.17566C10.6828 5.05693 10.5217 4.99023 10.3538 4.99023H5.28932ZM4.65625 8.16632C4.65625 7.99842 4.72295 7.8374 4.84167 7.71868C4.96039 7.59996 5.12142 7.53326 5.28932 7.53326H10.3538C10.5217 7.53326 10.6828 7.59996 10.8015 7.71868C10.9202 7.8374 10.9869 7.99842 10.9869 8.16632C10.9869 8.33422 10.9202 8.49524 10.8015 8.61397C10.6828 8.73269 10.5217 8.79939 10.3538 8.79939H5.28932C5.12142 8.79939 4.96039 8.73269 4.84167 8.61397C4.72295 8.49524 4.65625 8.33422 4.65625 8.16632ZM5.28932 10.0763C5.12142 10.0763 4.96039 10.143 4.84167 10.2617C4.72295 10.3804 4.65625 10.5414 4.65625 10.7093C4.65625 10.8772 4.72295 11.0383 4.84167 11.157C4.96039 11.2757 5.12142 11.3424 5.28932 11.3424H10.3538C10.5217 11.3424 10.6828 11.2757 10.8015 11.157C10.9202 11.0383 10.9869 10.8772 10.9869 10.7093C10.9869 10.5414 10.9202 10.3804 10.8015 10.2617C10.6828 10.143 10.5217 10.0763 10.3538 10.0763H5.28932Z\" fill=\"#4B4B4B\"/>\n" +
            "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M14.1535 8.16659C14.1535 11.663 11.3193 14.4972 7.82284 14.4972C4.32642 14.4972 1.49219 11.663 1.49219 8.16659C1.49219 4.67017 4.32642 1.83594 7.82284 1.83594C11.3193 1.83594 14.1535 4.67017 14.1535 8.16659ZM12.8874 8.16659C12.8874 9.50979 12.3538 10.798 11.404 11.7477C10.4542 12.6975 9.16604 13.2311 7.82284 13.2311C6.47965 13.2311 5.19146 12.6975 4.24168 11.7477C3.2919 10.798 2.75832 9.50979 2.75832 8.16659C2.75832 6.8234 3.2919 5.53521 4.24168 4.58543C5.19146 3.63565 6.47965 3.10207 7.82284 3.10207C9.16604 3.10207 10.4542 3.63565 11.404 4.58543C12.3538 5.53521 12.8874 6.8234 12.8874 8.16659Z\" fill=\"#4B4B4B\"/>\n" +
            "</svg>\n"
    },
    {
        name: "Preview",
        icon: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
            "<g clip-path=\"url(#clip0_4572_1811)\">\n" +
            "<path d=\"M7.85417 11.4993C11.4261 11.4993 14.3216 7.67347 14.3216 7.67347C14.3216 7.67347 11.4261 3.84766 7.85417 3.84766C4.2822 3.84766 1.38672 7.67347 1.38672 7.67347C1.38672 7.67347 4.2822 11.4993 7.85417 11.4993Z\" stroke=\"#4B4B4B\" stroke-width=\"2\" stroke-linejoin=\"round\"/>\n" +
            "<path d=\"M7.85514 9.26826C8.28396 9.26826 8.69522 9.10031 8.99844 8.80136C9.30166 8.50241 9.47201 8.09695 9.47201 7.67417C9.47201 7.25139 9.30166 6.84593 8.99844 6.54698C8.69522 6.24803 8.28396 6.08008 7.85514 6.08008C7.42633 6.08008 7.01507 6.24803 6.71185 6.54698C6.40863 6.84593 6.23828 7.25139 6.23828 7.67417C6.23828 8.09695 6.40863 8.50241 6.71185 8.80136C7.01507 9.10031 7.42633 9.26826 7.85514 9.26826Z\" stroke=\"#4B4B4B\" stroke-width=\"2\" stroke-linejoin=\"round\"/>\n" +
            "</g>" +
            "<defs>" +
            "<clipPath id=\"clip0_4572_1811\">" +
            "<rect width=\"15.5219\" height=\"15.3033\" fill=\"white\" transform=\"translate(0.09375 0.0214844)\"/>" +
            "</clipPath>" +
            "</defs>" +
            "</svg>"
    }
]

export class ApplicationCreatorSidebar {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.applicationPagesRoot = document.querySelector('#application-page-container');
        this.invalidate();
    }

    async beforeRender() {
        this.sidebarItems = sidebarItems.map(item => {
            this[`open${item.name}`] = function (eventTarget) {
                this.applicationPagesRoot.innerHTML = `<application-creator-${item.name.toLowerCase()} data-presenter="application-creator-${item.name.toLowerCase()}"></application-creator-${item.name.toLowerCase()}>`;
            };
            return `<li class="application-sidebar-item" data-local-action="open${item.name}">${item.icon}<span>${item.name}</span></li>`;
        }).join('');
    }

    async afterRender() {

    }
}